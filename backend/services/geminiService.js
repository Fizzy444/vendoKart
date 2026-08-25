import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment or .env file.");
}

const genAI = new GoogleGenerativeAI(apiKey || "DUMMY_KEY");

/**
 * Generate embedding vector (768 dimensions) for a given text
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
export async function getEmbedding(text) {
  if (!apiKey) {
    // If no key is set, return a dummy embedding vector of 768 elements (for testing/safety)
    return new Array(768).fill(0).map((_, i) => Math.sin(i + text.length));
  }
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    if (result && result.embedding && result.embedding.values) {
      return result.embedding.values;
    }
    throw new Error("Invalid response format from embedding API");
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Extract structured requirements from a natural-language search query
 * @param {string} query 
 * @returns {Promise<{product: string|null, quantity: number|null, max_budget: number|null, max_manufacturing_days: number|null}>}
 */
export async function extractRequirements(query) {
  if (!apiKey) {
    // Fallback parser for testing without API keys (regex based)
    return parseRequirementsFallback(query);
  }
  try {
    const schema = {
      type: "object",
      properties: {
        product: {
          type: "string",
          description: "The name, type, category or keyword of the product the user is looking for (e.g. 'pots', 'toy', 'sari'). Return null if not specified."
        },
        quantity: {
          type: "integer",
          description: "The quantity or number of items the user needs. Return null if not specified."
        },
        max_budget: {
          type: "integer",
          description: "The maximum price, budget, or spending limit in INR (Rupees). Return null if not specified."
        },
        max_manufacturing_days: {
          type: "integer",
          description: "The maximum number of days allowed for manufacturing/delivery/preparation. Return null if not specified."
        }
      },
      required: ["product", "quantity", "max_budget", "max_manufacturing_days"]
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const prompt = `Analyze this search query from an e-commerce marketplace and extract any specific requirements for product name/keywords, quantity, maximum budget (in rupees), and maximum manufacturing/preparation time (in days).
Query: "${query}"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error extracting requirements via Gemini, falling back to regex parser:", error);
    return parseRequirementsFallback(query);
  }
}

/**
 * Generate a grounded answer based strictly on retrieved product data
 * @param {string} query 
 * @param {Array<object>} products 
 * @returns {Promise<string>}
 */
export async function generateGroundedAnswer(query, products) {
  if (products.length === 0) {
    return "NOT_AVAILABLE";
  }

  if (!apiKey) {
    // Basic local RAG fallback for tests running without API Key
    return generateLocalGroundedAnswerFallback(query, products);
  }

  try {
    const systemInstruction = `You are a Buyer Search Assistant for an artisan e-commerce marketplace.
Your task is to answer the buyer's query based ONLY on the retrieved products list.

CRITICAL RULES:
1. Use ONLY the retrieved seller product data provided in the context to answer. Do NOT invent, assume, or extrapolate any information.
2. NEVER mention or recommend products, prices, sellers, delivery times, or stock that are not explicitly present in the provided retrieved products.
3. If the retrieved products list is empty, or if none of the retrieved products are sufficiently relevant to satisfy the buyer's query, you MUST return exactly the word: NOT_AVAILABLE
4. If relevant products are available, summarize them clearly and concisely. Mention their name, price, stock, and who the seller is.
5. If the buyer requested a specific constraint (like price, quantity, or manufacturing days) and the products listed do not meet them, you must return NOT_AVAILABLE.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    const prompt = `Buyer Query: "${query}"

Retrieved Products:
${JSON.stringify(products, null, 2)}

Provide your response according to the rules (if no products are relevant, reply with ONLY the word "NOT_AVAILABLE"):`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim();
    return answer;
  } catch (error) {
    console.error("Error generating grounded answer:", error);
    return generateLocalGroundedAnswerFallback(query, products);
  }
}

/**
 * Regex-based fallback parser for local testing / offline mode
 */
function parseRequirementsFallback(query) {
  const normalized = query.toLowerCase();
  
  // Try to match quantity (e.g. "20 pots", "need 50")
  let quantity = null;
  const qtyMatch = normalized.match(/(\d+)\s*(pcs|pieces|units|items|pots|toys|diyas|saris|bags|of)?/);
  if (qtyMatch) {
    const val = parseInt(qtyMatch[1]);
    if (val > 0 && val < 1000) quantity = val; // avoid matching year or budget as quantity
  }
  
  // Try to match budget (e.g. "under ₹2000", "under 2000", "budget 2000")
  let max_budget = null;
  const budgetMatch = normalized.match(/(under|below|max|maximum|₹|rs\.?)\s*(\d+)/) || normalized.match(/(\d+)\s*(rupees|inr|rs)/);
  if (budgetMatch) {
    // If it's a dual match or we need to extract digits
    const val = parseInt(budgetMatch[2] || budgetMatch[1]);
    if (val > 100) max_budget = val;
  }

  // Try to match manufacturing days (e.g. "within 2 days", "in 5 days", "manufactured within 2 days")
  let max_manufacturing_days = null;
  const daysMatch = normalized.match(/(within|in|under|max)?\s*(\d+)\s*days?/);
  if (daysMatch) {
    max_manufacturing_days = parseInt(daysMatch[2]);
  }

  // Extract search keyword: remove numbers, prices, days, and verbs
  let product = normalized
    .replace(/(i need|i want|search for|find me|show me|buy)/g, "")
    .replace(/\d+\s*(days|day)/g, "")
    .replace(/(under|below|max|maximum|₹|rs\.?)\s*\d+/g, "")
    .replace(/\d+/g, "")
    .replace(/(manufactured within|within|manufactured|days|days|need|want|budget|quantity|items|pieces|pcs)/g, "")
    .trim();

  // Clean trailing punctuation and spaces
  product = product.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ").trim();

  return {
    product: product || null,
    quantity,
    max_budget,
    max_manufacturing_days
  };
}

/**
 * Simple local grounded fallback answering for offline tests
 */
function generateLocalGroundedAnswerFallback(query, products) {
  if (products.length === 0) return "NOT_AVAILABLE";
  
  const items = products.map(p => `- ${p.name} (₹${p.price}) by ${p.seller_name}. Stock: ${p.stock}, ready in ${p.manufacturing_days} days.`).join("\n");
  return `Based on the marketplace data, I found these matching items:\n${items}`;
}

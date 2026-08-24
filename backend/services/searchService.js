import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getEmbedding, extractRequirements, generateGroundedAnswer } from "./geminiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTS_FILE_PATH = path.join(__dirname, "../data/seller_products.json");
const EMBEDDINGS_FILE_PATH = path.join(__dirname, "../data/embeddings.json");

let products = [];
let embeddingsCache = {}; // id -> vector[]

// Load products and initialize embeddings on load
try {
  if (fs.existsSync(PRODUCTS_FILE_PATH)) {
    const rawData = fs.readFileSync(PRODUCTS_FILE_PATH, "utf8");
    products = JSON.parse(rawData);
    console.log(`Loaded ${products.length} products from database.`);
  } else {
    console.error("Products file not found at:", PRODUCTS_FILE_PATH);
  }
} catch (error) {
  console.error("Error reading products file:", error);
}

/**
 * Initialize embeddings for all products and cache them.
 */
export async function initializeSearchIndex() {
  try {
    if (fs.existsSync(EMBEDDINGS_FILE_PATH)) {
      const rawEmbeddings = fs.readFileSync(EMBEDDINGS_FILE_PATH, "utf8");
      embeddingsCache = JSON.parse(rawEmbeddings);
      console.log(`Loaded ${Object.keys(embeddingsCache).length} cached embeddings.`);
    } else {
      console.log("Embeddings cache not found. Generating embeddings...");
      await regenerateEmbeddings();
    }
    
    // Verify that all products have an embedding. If a new product was added, update it.
    const missingIds = products.filter(p => !embeddingsCache[p.id]);
    if (missingIds.length > 0) {
      console.log(`Found ${missingIds.length} products missing embeddings. Updating index...`);
      for (const p of missingIds) {
        const textToEmbed = getProductIndexText(p);
        embeddingsCache[p.id] = await getEmbedding(textToEmbed);
      }
      saveEmbeddingsCache();
    }
  } catch (error) {
    console.error("Failed to initialize search index:", error);
  }
}

/**
 * Combine relevant fields of a product to create a rich index text.
 */
function getProductIndexText(product) {
  return `Product: ${product.name}. Category: ${product.category}. Description: ${product.description}. Seller: ${product.seller_name}. Location: ${product.seller_location}.`;
}

/**
 * Re-generate all embeddings and save cache
 */
async function regenerateEmbeddings() {
  embeddingsCache = {};
  for (const p of products) {
    console.log(`Generating embedding for: ${p.name}`);
    const text = getProductIndexText(p);
    embeddingsCache[p.id] = await getEmbedding(text);
  }
  saveEmbeddingsCache();
}

function saveEmbeddingsCache() {
  try {
    const dataDir = path.dirname(EMBEDDINGS_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(EMBEDDINGS_FILE_PATH, JSON.stringify(embeddingsCache, null, 2), "utf8");
    console.log("Embeddings cache successfully saved.");
  } catch (error) {
    console.error("Failed to save embeddings cache:", error);
  }
}

/**
 * Calculate Cosine Similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Fetch autocomplete suggestions for the buyer
 * Optimized for speed: Exact & Prefix string matching, semantic matching fallback if needed.
 * @param {string} rawQuery 
 * @returns {Promise<Array<object>>}
 */
export async function getAutocompleteSuggestions(rawQuery) {
  const query = (rawQuery || "").trim().toLowerCase();
  if (!query) return [];

  // 1. Text-based prefix/contains matching (Super fast)
  let suggestions = [];
  const matchedProductIds = new Set();

  for (const p of products) {
    const nameMatch = p.name.toLowerCase().includes(query);
    const catMatch = p.category.toLowerCase().includes(query);
    const descMatch = p.description.toLowerCase().includes(query);

    if (nameMatch || catMatch || descMatch) {
      // Prioritize name matches
      let score = 0;
      if (p.name.toLowerCase().startsWith(query)) score += 10;
      else if (nameMatch) score += 5;
      if (p.category.toLowerCase().startsWith(query)) score += 4;
      else if (catMatch) score += 2;

      suggestions.push({
        product: p,
        score: score
      });
      matchedProductIds.add(p.id);
    }
  }

  // Sort suggestions by matching score
  suggestions.sort((a, b) => b.score - a.score);
  let finalResults = suggestions.map(s => s.product);

  // 2. Semantic matching fallback (If text search returns few results, e.g. < 3)
  if (finalResults.length < 3 && process.env.GEMINI_API_KEY) {
    try {
      const queryEmbedding = await getEmbedding(query);
      const semanticMatches = [];

      for (const p of products) {
        if (matchedProductIds.has(p.id)) continue; // skip already found

        const prodEmbedding = embeddingsCache[p.id];
        if (prodEmbedding) {
          const similarity = cosineSimilarity(queryEmbedding, prodEmbedding);
          // High threshold for autocomplete suggestions (0.45+)
          if (similarity >= 0.45) {
            semanticMatches.push({ product: p, similarity });
          }
        }
      }

      semanticMatches.sort((a, b) => b.similarity - a.similarity);
      finalResults = [...finalResults, ...semanticMatches.map(m => m.product)];
    } catch (error) {
      console.error("Autocomplete semantic fallback failed:", error);
    }
  }

  // Return top 5 suggestions
  return finalResults.slice(0, 5);
}

/**
 * Handle natural-language search query:
 * 1. Extract requirements
 * 2. Perform semantic search / cosine similarity
 * 3. Apply structured filters
 * 4. Rank results
 * 5. Call grounded RAG generator
 * @param {string} query 
 * @returns {Promise<{answer: string, products: Array<object>, extractedRequirements: object}>}
 */
export async function searchProducts(query) {
  if (!query || !query.trim()) {
    return {
      answer: "Please enter a search query.",
      products: [],
      extractedRequirements: {}
    };
  }

  // Step 1: Extract requirements using NLP (Gemini)
  const requirements = await extractRequirements(query);
  console.log("Extracted Requirements:", requirements);

  // Step 2: Compute Semantic Similarity
  let queryEmbedding;
  let scoredProducts = [];
  const hasApiKey = !!process.env.GEMINI_API_KEY;

  if (hasApiKey) {
    try {
      // Generate embedding for the full query to capture context
      queryEmbedding = await getEmbedding(query);
    } catch (error) {
      console.error("Failed to generate query embedding, using text-based matching:", error);
    }
  }

  for (const p of products) {
    let score = 0;
    
    if (hasApiKey && queryEmbedding && embeddingsCache[p.id]) {
      score = cosineSimilarity(queryEmbedding, embeddingsCache[p.id]);
    } else {
      // Offline/Fallback keyword matching logic
      const searchTarget = (requirements.product || query).toLowerCase();
      const queryWords = searchTarget.split(/\s+/).filter(w => w.length > 1);
      const targetText = `${p.name} ${p.category} ${p.description}`.toLowerCase();
      
      let matches = 0;
      let matchedSpecificWords = 0;
      let hasIrrelevantUnmatchedSpecificWords = false;

      queryWords.forEach(word => {
        // Check if word is generic or stop word
        const isGeneric = /^(gifts?|items?|products?|goods?|crafts?|things?|anything|something|under|within|need|want|find|show|manufactured|days?|that|can|be|the|a|an|for|in|i|to|is|with)$/i.test(word);
        // Basic stemming (pots -> pot, toys -> toy)
        let cleanWord = word.replace(/s$/, "");
        
        if (targetText.includes(cleanWord) || targetText.includes(word)) {
          matches++;
          if (!isGeneric) {
            matchedSpecificWords++;
          }
        } else {
          // If we fail to match a specific non-generic word (e.g. "swimming", "pool", "laptop")
          if (!isGeneric && word.length > 3) {
            hasIrrelevantUnmatchedSpecificWords = true;
          }
        }
      });

      if (queryWords.length > 0) {
        score = matches / queryWords.length;
        // Boost matches that contain specific terms
        if (matchedSpecificWords > 0) {
          score = Math.max(score, 0.5);
        }
        // If the query is purely generic (only contains generic words and no specific words failed to match)
        if (matchedSpecificWords === 0 && !hasIrrelevantUnmatchedSpecificWords) {
          score = 0.5;
        }
        // Penalize score if it contains important specific terms that did NOT match (e.g. "swimming pool")
        if (hasIrrelevantUnmatchedSpecificWords) {
          score = score * 0.2; // severely reduce score below 0.35 threshold
        }
      } else {
        score = 0.5; // generic queries get a baseline to allow structured filters
      }
    }

    // Boost score if the query terms directly match product name (exact word matching boost)
    const normalizedName = p.name.toLowerCase();
    const querySearchTerm = (requirements.product || "").toLowerCase();
    if (querySearchTerm && normalizedName.includes(querySearchTerm)) {
      score += 0.15; // significant boost
    }

    scoredProducts.push({
      ...p,
      similarityScore: score
    });
  }

  // Step 3: Apply Semantic Threshold Filter
  // Only keep products that are semantically relevant (threshold = 0.35)
  // This prevents irrelevant recommendations when the user queries for something not present.
  let filteredProducts = scoredProducts.filter(p => p.similarityScore >= 0.35);

  // Step 4: Apply Structured Filters
  if (requirements.max_budget !== null) {
    filteredProducts = filteredProducts.filter(p => p.price <= requirements.max_budget);
  }
  if (requirements.quantity !== null) {
    // Quantity requirement maps to stock checking (must have enough in stock)
    filteredProducts = filteredProducts.filter(p => p.stock >= requirements.quantity);
  }
  if (requirements.max_manufacturing_days !== null) {
    filteredProducts = filteredProducts.filter(p => p.manufacturing_days <= requirements.max_manufacturing_days);
  }

  // Step 5: Rank results (highest score first)
  filteredProducts.sort((a, b) => b.similarityScore - a.similarityScore);

  // Step 6: Perform Grounded RAG synthesis
  // Strip similarityScore to send clean data to Gemini
  const cleanProducts = filteredProducts.map(({ similarityScore, ...p }) => p);
  
  let answer = "";
  if (cleanProducts.length === 0) {
    answer = "NOT_AVAILABLE";
  } else {
    answer = await generateGroundedAnswer(query, cleanProducts);
  }

  // If Gemini determined no product is sufficiently relevant or returned NOT_AVAILABLE
  if (answer.trim() === "NOT_AVAILABLE") {
    return {
      answer: "No matching products available in our marketplace.",
      products: [],
      extractedRequirements: requirements
    };
  }

  return {
    answer: answer,
    products: cleanProducts,
    extractedRequirements: requirements
  };
}

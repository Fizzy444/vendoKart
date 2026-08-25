import dotenv from "dotenv";
import { initializeSearchIndex, searchProducts, getAutocompleteSuggestions } from "./services/searchService.js";

// Load environment variables
dotenv.config();

async function runTests() {
  console.log("==================================================");
  console.log("   VENDOKART BUYER SEARCH & RETRIEVAL TEST SUITE  ");
  console.log("==================================================");
  
  // 1. Initialize search index (loads products and cache)
  console.log("\n[SETUP] Initializing Search Index...");
  await initializeSearchIndex();
  console.log("[SETUP] Index initialized successfully.\n");

  const testCases = [
    {
      id: 1,
      name: "Prefix Autocomplete Test (Type 'wood')",
      action: async () => {
        const result = await getAutocompleteSuggestions("wood");
        return {
          query: "wood",
          suggestionsFound: result.length,
          suggestions: result.map(p => `${p.name} (₹${p.price}) in category '${p.category}'`)
        };
      }
    },
    {
      id: 2,
      name: "Autocomplete for Non-existent term (Type 'swimming')",
      action: async () => {
        const result = await getAutocompleteSuggestions("swimming");
        return {
          query: "swimming",
          suggestionsFound: result.length,
          suggestions: result
        };
      }
    },
    {
      id: 3,
      name: "Natural Language Search with Budget Constraint",
      action: async () => {
        // "handmade gifts under ₹1000"
        const result = await searchProducts("handmade gifts under ₹1000");
        return {
          query: "handmade gifts under ₹1000",
          extracted: result.extractedRequirements,
          response: result.answer,
          productsCount: result.products.length,
          products: result.products.map(p => `${p.name} (₹${p.price})`)
        };
      }
    },
    {
      id: 4,
      name: "Natural Language Search with Quantity & Budget",
      action: async () => {
        // "I need 20 pots under ₹2000"
        const result = await searchProducts("I need 20 pots under ₹2000");
        return {
          query: "I need 20 pots under ₹2000",
          extracted: result.extractedRequirements,
          response: result.answer,
          productsCount: result.products.length,
          products: result.products.map(p => `${p.name} (Price: ₹${p.price}, Stock: ${p.stock})`)
        };
      }
    },
    {
      id: 5,
      name: "Natural Language Search with Manufacturing Days",
      action: async () => {
        // "I want gifts that can be manufactured within 2 days"
        const result = await searchProducts("I want gifts that can be manufactured within 2 days");
        return {
          query: "I want gifts that can be manufactured within 2 days",
          extracted: result.extractedRequirements,
          response: result.answer,
          productsCount: result.products.length,
          products: result.products.map(p => `${p.name} (Mfg time: ${p.manufacturing_days} days)`)
        };
      }
    },
    {
      id: 6,
      name: "No-Result / NOT_AVAILABLE Fallback Test",
      action: async () => {
        // "I need a swimming pool for the toys"
        const result = await searchProducts("I need a swimming pool for the toys");
        return {
          query: "I need a swimming pool for the toys",
          extracted: result.extractedRequirements,
          response: result.answer,
          productsCount: result.products.length,
          products: result.products
        };
      }
    }
  ];

  for (const tc of testCases) {
    console.log(`--------------------------------------------------`);
    console.log(`TEST CASE ${tc.id}: ${tc.name}`);
    console.log(`--------------------------------------------------`);
    try {
      const output = await tc.action();
      console.log(JSON.stringify(output, null, 2));
    } catch (error) {
      console.error(`Test Case ${tc.id} failed with error:`, error);
    }
    console.log("\n");
  }

  console.log("==================================================");
  console.log("              TESTING COMPLETE                    ");
  console.log("==================================================");
}

runTests();

import dotenv from "dotenv";
import { initializeSearchIndex, searchProducts } from "./services/searchService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { extractRequirements } from "./services/geminiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRODUCTS_FILE_PATH = path.join(__dirname, "data/seller_products.json");

dotenv.config();

async function debug() {
  await initializeSearchIndex();
  const query = "I need 20 pots under ₹2000";
  console.log("Query:", query);
  
  const requirements = await extractRequirements(query);
  console.log("Requirements:", requirements);
  
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE_PATH, "utf8"));
  
  for (const p of products) {
    const searchTarget = (requirements.product || query).toLowerCase();
    const queryWords = searchTarget.split(/\s+/).filter(w => w.length > 1);
    const targetText = `${p.name} ${p.category} ${p.description}`.toLowerCase();
    
    let matches = 0;
    let matchedSpecificWords = 0;
    let hasIrrelevantUnmatchedSpecificWords = false;

    queryWords.forEach(word => {
      const isGeneric = /^(gifts?|items?|products?|goods?|crafts?|things?|anything|something|under|within|need|want|find|show|manufactured|days?)$/i.test(word);
      let cleanWord = word.replace(/s$/, "");
      
      const containsClean = targetText.includes(cleanWord);
      const containsRaw = targetText.includes(word);
      
      if (containsClean || containsRaw) {
        matches++;
        if (!isGeneric) {
          matchedSpecificWords++;
        }
      } else {
        if (!isGeneric && word.length > 3) {
          hasIrrelevantUnmatchedSpecificWords = true;
        }
      }
    });

    let score = 0;
    if (queryWords.length > 0) {
      score = matches / queryWords.length;
      if (matchedSpecificWords > 0) {
        score = Math.max(score, 0.5);
      }
      if (hasIrrelevantUnmatchedSpecificWords) {
        score = score * 0.2;
      }
    } else {
      score = 0.5;
    }

    // Boost score if the query terms directly match product name (exact word matching boost)
    const normalizedName = p.name.toLowerCase();
    const querySearchTerm = (requirements.product || "").toLowerCase();
    let boosted = false;
    if (querySearchTerm && normalizedName.includes(querySearchTerm)) {
      score += 0.15;
      boosted = true;
    }

    console.log(`Product: ${p.name}`);
    console.log(`  queryTarget: "${searchTarget}"`);
    console.log(`  words: ${JSON.stringify(queryWords)}`);
    console.log(`  matches: ${matches}, matchedSpecific: ${matchedSpecificWords}, unmatchedSpecific: ${hasIrrelevantUnmatchedSpecificWords}`);
    console.log(`  initialScore: ${score - (boosted ? 0.15 : 0)}, boosted: ${boosted}, finalScore: ${score}`);
    console.log(`  Filters check: price: ${p.price} <= ${requirements.max_budget} (${p.price <= requirements.max_budget}), stock: ${p.stock} >= ${requirements.quantity} (${p.stock >= requirements.quantity})`);
  }
}

debug();

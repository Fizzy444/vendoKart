import express from "express";
import { getAutocompleteSuggestions, searchProducts } from "../services/searchService.js";

const router = express.Router();

// Autocomplete route
router.get("/autocomplete", async (req, res) => {
  try {
    const query = req.query.q || "";
    const suggestions = await getAutocompleteSuggestions(query);
    res.json({
      success: true,
      suggestions: suggestions
    });
  } catch (error) {
    console.error("Autocomplete endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during autocomplete generation"
    });
  }
});

// Semantic Search & RAG route
router.post("/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const result = await searchProducts(query);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Search endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during search query processing"
    });
  }
});

export default router;

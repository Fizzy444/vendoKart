import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import searchRouter from "./routes/searchRoutes.js";
import { initializeSearchIndex } from "./services/searchService.js";

// Load dotenv
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend integration
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", searchRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Start server after initializing search index
async function startServer() {
  console.log("Initializing Search Index...");
  await initializeSearchIndex();
  
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`  vendoKart Buyer Search & Autocomplete API server`);
    console.log(`  Running on: http://localhost:${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/health`);
    console.log(`=================================================`);
  });
}

startServer().catch(err => {
  console.error("Critical error during server startup:", err);
  process.exit(1);
});

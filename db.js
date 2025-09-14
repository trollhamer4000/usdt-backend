import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("🚀 Server is running!");
});

// Start after DB connection
connectDB()
  .then((db) => {
    console.log("✅ MongoDB connected, starting server...");
    app.listen(PORT, () => {
      console.log(`⚡ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Could not start server", err);
    process.exit(1);
  });
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { connectDB } from "./db.js"; // your new Postgres db.js
import accountsRouter from "./accounts.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Mount all /api routes
app.use("/api", accountsRouter);

// Test route
app.get("/", (req, res) => res.send("USDT Backend is running 🚀"));

// Start server after DB connection
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB(); // connect to Postgres
    app.listen(PORT, () =>
      console.log(`⚡ Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to connect to DB", err);
    process.exit(1); // exit if DB connection fails
  }
})();
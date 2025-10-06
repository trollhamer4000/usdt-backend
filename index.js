import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { connectDB } from "./db.js";
import accountsRouter from "./accounts.js";

dotenv.config();
console.log("🔐 SENDGRID_API_KEY starts with:", process.env.SENDGRID_API_KEY?.substring(0, 3));
console.log("🔐 FROM_EMAIL:", process.env.FROM_EMAIL);

const app = express();
app.use(cors());
app.use(bodyParser.json());
console.log("SendGrid Key starts with:", process.env.SENDGRID_API_KEY?.slice(0, 3));

// 🔍 Log every incoming request
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.originalUrl}`, req.body || {});
  next();
});

// Mount all /api routes
app.use("/api", accountsRouter);

// Test route
app.get("/", (req, res) => res.send("USDT Backend is running 🚀"));

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () =>
      console.log(`⚡ Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to connect to DB", err);
    process.exit(1);
  }
})();
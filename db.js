// db.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI; // ✅ Ensure this is set in Render

let client;
let database;

export async function connectDB() {
  if (database) {
    // Already connected
    return database;
  }

  try {
    client = new MongoClient(uri, {
      ssl: true,
      tlsAllowInvalidCertificates: false,
      serverSelectionTimeoutMS: 10000,
    });

    await client.connect();
    database = client.db(); // Save reference globally
    console.log("✅ Connected to MongoDB");
    return database;
  } catch (err) {
    console.error("❌ Failed to connect to DB", err);
    process.exit(1);
  }
}

// Helper so you can call db anywhere after connectDB()
export function getDb() {
  if (!database) {
    throw new Error("❌ Database not initialized. Call connectDB() first.");
  }
  return database;
}
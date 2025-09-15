import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI; // ✅ from Render env

// Mask password for safe logging
const safeUri = uri ? uri.replace(/\/\/(.):(.)@/, "//<user>:<pass>@") : "❌ No URI found";
console.log("📡 Connecting to MongoDB with URI:", safeUri);

let client;
let database;

export async function connectDB() {
  try {
    const options = {
      serverSelectionTimeoutMS: 10000, // ✅ let Mongo handle TLS
    };

    console.log("⚙️ MongoClient options:", options);

    client = new MongoClient(uri, options);
    console.log("🚀 MongoClient instance created, attempting connection...");

    await client.connect();
    database = client.db(); // Save reference globally
    console.log("✅ Connected to MongoDB");
    return database;
  } catch (err) {
    console.error("❌ Failed to connect to DB");
    console.error("Error name:", err.name);
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
    console.error("Full error object:", err);
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
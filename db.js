import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI; // ✅ from Render or .env

// Mask sensitive info for safe logging
const safeUri = uri
  ? uri.replace(/\/\/([^:]+):([^@]+)@/, "//<user>:<pass>@")
  : "❌ No URI found";
console.log("📡 Connecting to MongoDB with URI:", safeUri);

let client;
let database;

export async function connectDB() {
  try {
    if (!uri) {
      console.error("❌ No MongoDB URI found in environment variables.");
      process.exit(1);
    }

    const options = {
      serverSelectionTimeoutMS: 10000, // timeout after 10s
    };

    console.log("⚙️ MongoClient options:", options);

    client = new MongoClient(uri, options);

    console.log("🚀 MongoClient instance created.");
    console.log("🔍 Checking initial client state:", {
      isConnected: client.topology?.isConnected?.() ?? "unknown",
      options: client.options,
    });

    console.log("⏳ Attempting connection...");
    await client.connect();

    console.log("✅ Client connected! Checking server info...");
    const admin = client.db().admin();
    const serverStatus = await admin.serverStatus();
    console.log("🖥️ MongoDB server status:", {
      host: serverStatus.host,
      version: serverStatus.version,
      process: serverStatus.process,
    });

    database = client.db();
    console.log("📂 Default DB selected:", database.databaseName);

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
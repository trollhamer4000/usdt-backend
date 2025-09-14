import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI; // ✅ matches Render

const client = new MongoClient(uri, {
  ssl: true,
  tlsAllowInvalidCertificates: false,
  serverSelectionTimeoutMS: 10000,
});

export async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    return client.db();
  } catch (err) {
    console.error("❌ Failed to connect to DB", err);
    process.exit(1);
  }
}
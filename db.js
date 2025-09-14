import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  ssl: true,
  tlsAllowInvalidCertificates: false, // keep secure
  serverSelectionTimeoutMS: 10000,    // helpful for Render
});

export async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    return client.db(); // return db object
  } catch (err) {
    console.error("❌ Failed to connect to DB", err);
    process.exit(1);
  }
}
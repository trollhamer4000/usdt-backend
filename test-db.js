// test-db.js
import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://rcakelvin_db_user:trollhammer4000@cluster0.d8xdxe9.mongodb.net/usdt_wallets?retryWrites=true&w=majority&appName=Cluster0";

// ✅ Only keep serverSelectionTimeoutMS
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
});

(async () => {
  try {
    console.log("📡 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    // Run server status check
    const admin = client.db().admin();
    const serverStatus = await admin.serverStatus();
    console.log("🖥️ MongoDB server info:", {
      host: serverStatus.host,
      version: serverStatus.version,
      process: serverStatus.process,
    });

    await client.close();
    console.log("🔌 Connection closed.");
  } catch (err) {
    console.error("❌ Connection failed:");
    console.error("Error name:", err.name);
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
    console.error("Full error object:", err);
  }
})();
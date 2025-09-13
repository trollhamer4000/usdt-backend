const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const dbName = "usdt_wallets"; // database name
let db;

async function connect() {
  if (!db) {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
    db = client.db(dbName);
  }
  return db;
}

function getDb() {
  if (!db) throw new Error("Database not connected");
  return db;
}

module.exports = { connect, getDb };
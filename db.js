// db.js
import pkg from "pg";
const { Pool } = pkg;

// ✅ Make sure DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL environment variable is not set.");
}

// ✅ Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Render requires SSL
});

// ✅ Connect and test the database
export async function connectDB() {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1"); // simple test query
    console.log("✅ Connected to Postgres successfully");
    client.release();
    return pool;
  } catch (err) {
    console.error("❌ Failed to connect to Postgres:", err.message);
    process.exit(1); // stop app if DB connection fails
  }
}

// ✅ General query function
export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error("❌ Query error:", err.message);
    throw err;
  }
}

// ✅ Helper to access DB safely
export function getDb() {
  return { query };
}
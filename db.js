import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // needed for Render
});

// Connect and test the database
export async function connectDB() {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1"); // simple test query
    console.log("✅ Connected to Postgres successfully");
    client.release();
    return pool;
  } catch (err) {
    console.error("❌ Failed to connect to Postgres", err);
    process.exit(1);
  }
}

// General query function
export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error("❌ Query error:", err);
    throw err;
  }
}

// Helper to check if DB is initialized
export function getDb() {
  if (!pool) {
    throw new Error("❌ Database not initialized. Call connectDB() first.");
  }
  return { query }; // return an object to mimic previous getDb() calls
}
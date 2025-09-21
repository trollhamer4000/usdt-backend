// db.js
import pkg from "pg";
const { Pool } = pkg;

let pool;

// ✅ Initialize DB connection lazily
function initPool() {
  const dbUrl = process.env.DATABASE_URL;

  // 🔍 Print environment + DB info
  console.log("🌍 NODE_ENV:", process.env.NODE_ENV || "not set");
  if (dbUrl) {
    // Mask username/password for safety
    const safeUrl = dbUrl.replace(/:\/\/(.):(.)@/, "://*:*@");
    console.log("🗄️ Using DATABASE_URL:", safeUrl);
  } else {
    console.warn("⚠️ DATABASE_URL is NOT set!");
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }, // Render requires SSL
    });
  }

  return pool;
}

// ✅ Connect and test the database
export async function connectDB() {
  const pool = initPool();
  if (!pool) {
    throw new Error("❌ DATABASE_URL is missing. Cannot connect to Postgres.");
  }

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
  const pool = initPool();
  if (!pool) throw new Error("❌ Database not initialized.");
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
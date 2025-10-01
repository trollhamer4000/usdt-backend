import { Router } from "express";
import { query } from "./db.js";
import { sendVerificationEmail, validateCode } from "./verification.js";

const router = Router();

// -------------------
// Generate RecoveryId (4 letters + 3 digits)
// -------------------
function generateRecoveryId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "";
  for (let i = 0; i < 4; i++) id += letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 3; i++) id += Math.floor(Math.random() * 10);
  return id;
}

// -------------------
// Request RecoveryId (server-generated, guaranteed unique)
// -------------------
router.post("/request_recovery_id", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send({ success: false, error: "Email is required" });
  }

  try {
    let recoveryId;
    while (true) {
      const candidate = generateRecoveryId();

      // check DB if candidate already exists
      const existing = await query(
        "SELECT 1 FROM users WHERE recovery_id = $1",
        [candidate]
      );

      if (existing.rowCount === 0) {
        recoveryId = candidate;
        break;
      }
      // else loop again to generate new candidate
    }

    res.send({ success: true, recoveryId }); // ✅ camelCase for Flutter
  } catch (err) {
    console.error("❌ Failed to generate recoveryId:", err.message);
    res.status(500).send({ success: false, error: "Server error" });
  }
});

// -------------------
// Ensure Unique RecoveryId
// -------------------
async function generateUniqueRecoveryId(email, walletAddress, nameTag, blobs) {
  while (true) {
    const candidate = generateRecoveryId();

    try {
      const result = await query(
        `INSERT INTO users (email, walletAddress, nameTag, blobs, recovery_id, subscriptionStatus)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING recovery_id`,
        [email, walletAddress, nameTag, blobs, candidate, "inactive"]
      );

      if (!result.rows || result.rows.length === 0) {
        throw new Error("Failed to generate recoveryId");
      }

      return result.rows[0].recovery_id; // snake_case from DB
    } catch (err) {
      if (err.code === "23505") {
        continue; // try again if duplicate recoveryid
      }
      throw err;
    }
  }
}

// -------------------
// Create Account
// -------------------
router.post("/create_account", async (req, res) => {
  const { email, walletAddress, nameTag, blobs } = req.body;

  if (!email || !walletAddress || !nameTag || !blobs) {
    return res.status(400).send({ success: false, error: "Missing fields" });
  }

  try {
    const existingEmail = await query("SELECT 1 FROM users WHERE email = $1", [email]);
    if (existingEmail.rowCount > 0) {
      return res.status(400).send({ success: false, error: "Email already exists" });
    }

    const recovery_id = await generateUniqueRecoveryId(email, walletAddress, nameTag, blobs);
    res.send({ success: true, recoveryId: recovery_id }); // ✅ camelCase response
  } catch (err) {
    console.error("❌ Create account error:", err.message);
    res.status(500).send({ success: false, error: "Server error" });
  }
});

// -------------------
// Email Verification Routes
// -------------------

// Send verification email
router.post("/send-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send({ success: false, error: "Email is required" });
  }

  try {
    await sendVerificationEmail(email);
    res.send({ success: true });
  } catch (err) {
    console.error("❌ Send verification failed:", err.message);
    res.status(500).send({ success: false, error: "Failed to send verification email" });
  }
});

// Verify code
router.post("/verify-code", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).send({ success: false, error: "Email and code are required" });
  }

  const result = validateCode(email, code);
  if (result.valid) {
    res.send({ success: true });
  } else {
    res.status(400).send({ success: false, error: result.reason });
  }
});

export default router;

// -------------------
// DEBUG: List tables and peek at users table
// -------------------
router.get("/debug/db", async (req, res) => {
  try {
    // List all tables in public schema
    const tables = await query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema='public'`
    );

    // Peek at first 5 rows of users table (if it exists)
    let usersRows = [];
    try {
      const result = await query(`SELECT * FROM users LIMIT 5`);
      usersRows = result.rows;
    } catch (err) {
      usersRows = `❌ Cannot query users table: ${err.message}`;
    }

    res.send({ success: true, tables: tables.rows, usersRows });
  } catch (err) {
    console.error("❌ Debug route failed:", err.message);
    res.status(500).send({ success: false, error: err.message });
  }
});
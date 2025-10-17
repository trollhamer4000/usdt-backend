import { Router } from "express";
import { query } from "./db.js";
import crypto from "crypto";
import { sendVerificationEmail, validateCode } from "./verification.js";

const router = Router();

// -------------------
// Generate Unique Recovery ID (4 letters + 3 digits)
// -------------------
function generateRecoveryId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const partLetters = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  const partDigits = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join("");
  return partLetters + partDigits;
}

// -------------------
// Create Account (unique checks + unique recovery ID)
// -------------------
router.post("/create_account", async (req, res) => {
  const { email, walletAddress, walletName, blobs } = req.body;

  if (!email || !walletAddress || !walletName || !blobs) {
    return res.status(400).send({ success: false, error: "Missing fields" });
  }

  try {
    // 🧩 Check if email already exists
    const existingEmail = await query("SELECT 1 FROM users WHERE email = $1", [email]);
    if (existingEmail.rowCount > 0) {
      return res.status(400).send({ success: false, error: "Email already exists" });
    }

    // 🧩 Check if wallet name already exists
    const existingName = await query("SELECT 1 FROM users WHERE nametag = $1", [walletName]);
    if (existingName.rowCount > 0) {
      return res.status(400).send({ success: false, error: "Wallet name already exists" });
    }

    // 🧩 Check if wallet address already exists
    const existingAddress = await query("SELECT 1 FROM users WHERE walletaddress = $1", [walletAddress]);
    if (existingAddress.rowCount > 0) {
      return res.status(400).send({ success: false, error: "Wallet address already exists" });
    }

    // ✅ Generate unique recovery ID and ensure no duplicates
    let recovery_id;
    while (true) {
      const candidate = generateRecoveryId();
      const existing = await query("SELECT 1 FROM users WHERE recovery_id = $1", [candidate]);
      if (existing.rowCount === 0) {
        recovery_id = candidate;
        break;
      }
    }

    // ✅ Insert user
    const result = await query(
      `INSERT INTO users (email, walletaddress, nametag, blobs, recovery_id, subscriptionstatus)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING recovery_id`,
      [email, walletAddress, walletName, JSON.stringify(blobs), recovery_id, "inactive"]
    );

    console.log("✅ User inserted:", email, "| Recovery ID:", result.rows[0].recovery_id);
    res.send({ success: true, recoveryId: result.rows[0].recovery_id });

  } catch (err) {
    console.error("❌ Create account error:", err.message);
    res.status(500).send({ success: false, error: "Server error" });
  }
});

// ✅ -------------------
// Login Route (Added Debug Logging)
// ✅ -------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("📩 [LOGIN REQUEST RECEIVED]", {
    time: new Date().toISOString(),
    ip: req.ip,
    email,
    passwordLength: password ? password.length : 0,
    userAgent: req.headers["user-agent"],
  });

  try {
    const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (rows.length === 0) {
      return res.json({ success: false, error: "Account not found" });
    }

    const user = rows[0];

    if (!user.passwordsalt || !user.passwordhash) {
      return res.json({ success: false, error: "Password not set on server" });
    }

    const storedSalt = Buffer.from(user.passwordsalt, "base64");
    const storedHash = user.passwordhash;

    const derivedKey = crypto.pbkdf2Sync(password, storedSalt, 200000, 32, "sha256");
    const computedHash = Buffer.from(derivedKey).toString("base64");

    if (computedHash !== storedHash) {
      return res.json({ success: false, error: "Invalid credentials" });
    }

    console.log("✅ Login SUCCESS for:", email);

    res.json({
      success: true,
      account: {
        email: user.email,
        wallet_name: user.nametag,
        wallet_address: user.walletaddress,
        encrypted_mnemonic: user.blobs?.encrypted_mnemonic,
        encrypted_privateKey: user.blobs?.encrypted_privateKey,
        recoveryId: user.recovery_id,
      },
    });
  } catch (err) {
    console.error("🔥 Login error:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// -------------------
// Email Verification Routes
// -------------------
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

// -------------------
// DEBUG: List tables and peek at users table
// -------------------
router.get("/debug/db", async (req, res) => {
  try {
    const tables = await query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
    );

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

export default router;
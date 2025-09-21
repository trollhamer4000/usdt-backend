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
// Ensure Unique RecoveryId
// -------------------
async function generateUniqueRecoveryId(email, walletAddress, nameTag, blobs) {
  while (true) {
    const candidate = generateRecoveryId();

    try {
      // Try inserting directly (relies on UNIQUE constraint in DB)
      const result = await query(
        `INSERT INTO users (email, walletAddress, nameTag, blobs, recovery_id, subscriptionStatus)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING recovery_id`,
        [email, walletAddress, nameTag, blobs, candidate, "inactive"]
      );

      return result.rows[0].recoveryid; // (lowercase property)
    } catch (err) {
      if (err.code === "23505") {
        // Duplicate recovery_id, loop again
        continue;
      }
      throw err; // Other DB error
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
    // Check if email already exists
    const existingEmail = await query("SELECT 1 FROM users WHERE email = $1", [email]);
    if (existingEmail.rowCount > 0) {
      return res.status(400).send({ success: false, error: "Email already exists" });
    }

    // Generate unique recovery_id and insert user
    const recoveryId = await generateUniqueRecoveryId(email, walletAddress, nameTag, blobs);

    res.send({ success: true, recoveryId });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, error: "Server error" });
  }
});

export default router;
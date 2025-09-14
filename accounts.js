const express = require("express");
const router = express.Router();
const { getDb } = require("../db");
const { sendVerificationEmail, validateCode } = require("../utils/verification");

// Helper: generate unique recoveryId (4 letters + 3 digits)
function generateRecoveryId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "";
  for (let i = 0; i < 4; i++) id += letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 3; i++) id += Math.floor(Math.random() * 10);
  return id;
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
    const db = getDb();
    const existing = await db.collection("users").findOne({ email });
    if (existing) return res.status(400).send({ success: false, error: "Email already exists" });

    let recoveryId, unique = false;
    while (!unique) {
      recoveryId = generateRecoveryId();
      const check = await db.collection("users").findOne({ recoveryId });
      if (!check) unique = true;
    }

    const newUser = {
      email,
      walletAddress,
      nameTag,
      blobs,
      recoveryId,
      subscriptionStatus: "inactive"
    };
    await db.collection("users").insertOne(newUser);

    res.send({ success: true, recoveryId });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, error: "Server error" });
  }
});

// -------------------
// Send verification code
// -------------------
router.post("/send_verification", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send({ error: "Email required" });

  try {
    const code = await sendVerificationEmail(email);
    console.log(`Verification code for ${email}: ${code}`);
    res.send({ success: true, message: "Verification email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to send email" });
  }
});

// -------------------
// Verify code
// -------------------
router.post("/verify_code", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).send({ error: "Email and code required" });

  const result = validateCode(email, code);
  if (result.valid) return res.send({ success: true, message: "Email verified" });
  res.status(400).send({ error: result.reason });
});

// -------------------
// Get nameTag by wallet
// -------------------
router.get("/name/:walletAddress", async (req, res) => {
  const { walletAddress } = req.params;
  try {
    const db = getDb();
    const user = await db.collection("users").findOne({ walletAddress });
    if (!user) return res.status(404).send({ error: "Wallet not found" });
    res.send({ nameTag: user.nameTag });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server error" });
  }
});

module.exports = router;
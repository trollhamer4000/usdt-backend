import nodemailer from "nodemailer";

const verificationCodes = {};
const MAX_ATTEMPTS = 5;
const CODE_TTL = 5 * 60 * 1000; // 5 minutes

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function checkEnv() {
  if (!process.env.EMAIL_USER) console.warn("⚠️ EMAIL_USER is not set.");
  if (!process.env.EMAIL_PASS) console.warn("⚠️ EMAIL_PASS is not set.");
}

// ✅ Send verification email
export async function sendVerificationEmail(email) {
  checkEnv();

  const code = generateCode();
  verificationCodes[email] = { code, expires: Date.now() + CODE_TTL, attempts: 0 };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // should be App Password if using Gmail
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "USDT Vault Verification Code",
    text: `Your verification code is: ${code}. It expires in 5 minutes.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}: ${info.response}`);
    console.log(`📝 Verification code for debugging: ${code}`); // optional
    return code;
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
    throw new Error("Failed to send verification email.");
  }
}

// ✅ Validate the code
export function validateCode(email, code) {
  const entry = verificationCodes[email];
  if (!entry) return { valid: false, reason: "Code not found" };

  if (Date.now() > entry.expires) {
    delete verificationCodes[email];
    return { valid: false, reason: "Code expired" };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    delete verificationCodes[email];
    return { valid: false, reason: "Too many attempts" };
  }

  entry.attempts++;
  if (entry.code === code) {
    delete verificationCodes[email];
    return { valid: true };
  }

  return { valid: false, reason: "Invalid code" };
}
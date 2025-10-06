// verification.js
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log("🧠 Loaded SendGrid key (first 10):", process.env.SENDGRID_API_KEY?.slice(0, 10));
const verificationCodes = new Map();

export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(email) {
  const code = generateVerificationCode();
  verificationCodes.set(email, { code, createdAt: Date.now() });

  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: "Your Wallet Verification Code",
    text: `Your verification code is: ${code}`,
    html: `<p>Your verification code is: <strong>${code}</strong></p>`,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
    throw err;
  }
}

export function validateCode(email, inputCode) {
  const record = verificationCodes.get(email);
  if (!record) return { valid: false, reason: "No code found for this email" };

  const expired = Date.now() - record.createdAt > 10 * 60 * 1000;
  if (expired) {
    verificationCodes.delete(email);
    return { valid: false, reason: "Code expired" };
  }

  if (record.code !== inputCode)
    return { valid: false, reason: "Invalid code" };

  verificationCodes.delete(email);
  return { valid: true };
}
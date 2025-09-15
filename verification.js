import nodemailer from "nodemailer";

const verificationCodes = {};
const MAX_ATTEMPTS = 5;
const CODE_TTL = 5 * 60 * 1000; // 5 minutes

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(email) {
  const code = generateCode();
  verificationCodes[email] = { code, expires: Date.now() + CODE_TTL, attempts: 0 };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "USDT Vault Verification Code",
    text: `Your verification code is: ${code}. It expires in 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
  return code;
}

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
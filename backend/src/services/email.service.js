import nodemailer from "nodemailer";

// Lazily built so a missing SMTP config doesn't crash server startup — SMTP_*
// is optional in dev, same "no backend for this yet" pragmatism as photo/logo
// data URLs elsewhere in this codebase. `undefined` = not yet resolved,
// `null` = resolved to "not configured".
let transporter;

function getTransporter() {
  if (transporter !== undefined) return transporter;

  if (!process.env.SMTP_HOST) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

// Fire-and-forget from callers — never throws or rejects, so a slow,
// misconfigured, or unreachable SMTP server can't block the request that
// triggered it (leave approval, employee creation, etc) or surface as an
// unhandled rejection when a caller doesn't attach a .catch().
export async function sendEmail({ to, subject, text }) {
  try {
    const client = getTransporter();
    if (!client) {
      console.log(`[email] SMTP not configured — skipping "${subject}" to ${to}`);
      return;
    }

    await client.sendMail({
      from: process.env.SMTP_FROM || "Dayflow <no-reply@dayflow.local>",
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("[email] send failed:", err.message);
  }
}

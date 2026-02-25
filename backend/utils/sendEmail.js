// email.js (or email.service.js)
// Works around Render IPv6 egress issues by forcing IPv4 for smtp.gmail.com.
// Recommended env for Render + Gmail:
// SMTP_HOST=smtp.gmail.com
// SMTP_PORT=587
// SMTP_SECURE=false
// SMTP_USER=your@gmail.com
// SMTP_PASS=your_google_app_password

import nodemailer from "nodemailer";
import dns from "node:dns/promises";
import dotenv from "dotenv";
dotenv.config();

const normalizeText = (value) => String(value ?? "").trim();
const toBool = (value) => /^(1|true|yes)$/i.test(String(value ?? "").trim());

const resolveIpv4 = async (hostname) => {
  // Use resolve4 to avoid any IPv6 selection entirely
  const ips = await dns.resolve4(hostname);
  if (!ips || ips.length === 0) {
    const err = new Error(`No IPv4 A records found for ${hostname}`);
    err.code = "NO_IPV4";
    throw err;
  }
  return ips[0];
};

const buildTransportConfig = async () => {
  const host = normalizeText(process.env.SMTP_HOST) || "smtp.gmail.com";
  const user = normalizeText(process.env.SMTP_USER);
  const pass = normalizeText(process.env.SMTP_PASS);

  if (!user || !pass) {
    throw new Error("SMTP credentials are missing (SMTP_USER/SMTP_PASS)");
  }

  const port = Number(normalizeText(process.env.SMTP_PORT) || "587");

  // 465 => implicit TLS (secure true)
  // 587 => STARTTLS (secure false)
  const secure =
    process.env.SMTP_SECURE !== undefined ? toBool(process.env.SMTP_SECURE) : port === 465;

  // Force IPv4 (Render often can't reach Gmail over IPv6)
  const ipv4Host = await resolveIpv4(host);

  const transportConfig = {
    host: ipv4Host, // connect to IPv4 address directly
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth: { user, pass },

    // Timeouts (tune as needed)
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,

    // IMPORTANT: when using an IP as host, set SNI + cert hostname
    tls: {
      servername: host, // ensures cert matches smtp.gmail.com
      minVersion: "TLSv1.2",
    },
  };

  return { from: user, originalHost: host, ipv4Host, transportConfig };
};

const sendMailWithHardTimeout = async (transporter, mailOptions, timeoutMs = 30000) => {
  let timeoutId;
  try {
    return await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          const err = new Error(`SMTP send timeout after ${timeoutMs}ms`);
          err.code = "SMTP_TIMEOUT";
          reject(err);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

// Send Email
export const sendEmail = async (options) => {
  const to = normalizeText(options?.email);
  const subject = normalizeText(options?.subject);
  const message = String(options?.message ?? "");

  if (!to || !subject || !message) {
    throw new Error("Invalid email payload (email/subject/message required)");
  }

  const { from, originalHost, ipv4Host, transportConfig } = await buildTransportConfig();

  // Useful debug (safe to keep)
  console.log(
    `[email] smtp target host=${originalHost} ipv4=${ipv4Host} port=${transportConfig.port} secure=${transportConfig.secure}`
  );

  const transporter = nodemailer.createTransport(transportConfig);

  // Optional: verify connection/auth (uncomment for debugging)
  // await transporter.verify();

  const mailOptions = {
    from,
    to,
    subject,
    text: message,
  };

  try {
    await sendMailWithHardTimeout(transporter, mailOptions, 30000);
    return { ok: true };
  } catch (error) {
    const code = error?.code ? ` code=${error.code}` : "";
    const responseCode = error?.responseCode ? ` responseCode=${error.responseCode}` : "";
    console.warn(`[email] send failed.${code}${responseCode} message=${error?.message || "unknown"}`);
    throw error;
  }
};
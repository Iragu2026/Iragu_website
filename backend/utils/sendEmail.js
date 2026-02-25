import nodemailer from "nodemailer";
import dns from "node:dns";
import dotenv from "dotenv";
dotenv.config();

const normalizeText = (value) => String(value || "").trim();
const toBool = (value) => /^(1|true|yes)$/i.test(String(value || "").trim());

try {
    dns.setDefaultResultOrder("ipv4first");
} catch {
    // Ignore if runtime does not support this API.
}

const buildTransportConfig = () => {
    const service = normalizeText(process.env.SMTP_SERVICE).toLowerCase();
    const hostFromEnv = normalizeText(process.env.SMTP_HOST);
    const user = normalizeText(process.env.SMTP_USER);
    const pass = normalizeText(process.env.SMTP_PASS);

    if (!user || !pass) {
        throw new Error("SMTP credentials are missing (SMTP_USER/SMTP_PASS)");
    }

    const isGmail = service === "gmail";
    const host = hostFromEnv || (isGmail ? "smtp.gmail.com" : "");
    const defaultPort = isGmail ? 465 : 587;
    const port = Number(process.env.SMTP_PORT || defaultPort);
    const secure = process.env.SMTP_SECURE !== undefined
        ? toBool(process.env.SMTP_SECURE)
        : port === 465;

    const transportConfig = {
        auth: { user, pass },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        family: 4,
        lookup: (hostname, options, callback) => {
            const cb = typeof options === "function" ? options : callback;
            dns.lookup(hostname, { family: 4, all: false }, cb);
        },
    };

    if (host) {
        transportConfig.host = host;
        transportConfig.port = Number.isFinite(port) ? port : defaultPort;
        transportConfig.secure = secure;
    } else if (service) {
        transportConfig.service = service;
    } else {
        throw new Error("SMTP provider is not configured (set SMTP_SERVICE or SMTP_HOST)");
    }

    return {
        from: user,
        transportConfig,
    };
};

const sendMailWithHardTimeout = async (transporter, mailOptions, timeoutMs = 20000) => {
    let timeoutId;
    try {
        return await Promise.race([
            transporter.sendMail(mailOptions),
            new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    const timeoutError = new Error(`SMTP send timeout after ${timeoutMs}ms`);
                    timeoutError.code = "SMTP_TIMEOUT";
                    reject(timeoutError);
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
    const message = String(options?.message || "");

    if (!to || !subject || !message) {
        throw new Error("Invalid email payload (to/subject/message required)");
    }

    const { from, transportConfig } = buildTransportConfig();
    const transporter = nodemailer.createTransport(transportConfig);

    const mailOptions = {
        from,
        to,
        subject,
        text: message,
    };

    try {
        await sendMailWithHardTimeout(transporter, mailOptions, 20000);
    } catch (error) {
        const code = error?.code ? ` code=${error.code}` : "";
        const responseCode = error?.responseCode ? ` responseCode=${error.responseCode}` : "";
        console.warn(`[email] send failed.${code}${responseCode} message=${error?.message || "unknown"}`);
        throw error;
    }
};

import express from "express";
const app = express();
import cors from "cors";
import dotenv from "dotenv";
import product from "./routes/productRoutes.js";
import errorHandleMiddleware from "./middleware/error.js";
import user from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";
import order from "./routes/orderRoutes.js";
import {
    authRateLimitMiddleware,
    passwordResetRateLimitMiddleware,
} from "./middleware/rateLimit.js";

dotenv.config({ path: "backend/config/config.env" });

const isProduction = process.env.NODE_ENV === "production";
const fallbackOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const configuredOrigins = String(
    process.env.CORS_ORIGINS || process.env.FRONTEND_URL || ""
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedOrigins = configuredOrigins.length ? configuredOrigins : fallbackOrigins;

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    optionsSuccessStatus: 200,
}));
app.disable("x-powered-by");
if (isProduction) {
    app.set("trust proxy", 1);
}
app.use("/api/v1/payment/razorpay/webhook", express.raw({ type: "application/json", limit: "1mb" }));
app.use("/api/v1/payments/razorpay/webhook", express.raw({ type: "application/json", limit: "1mb" }));
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (isProduction) {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
});
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use("/api/v1/login", authRateLimitMiddleware);
app.use("/api/v1/register", authRateLimitMiddleware);
app.use("/api/v1/password/forgot", passwordResetRateLimitMiddleware);
app.use("/api/v1/password/reset", passwordResetRateLimitMiddleware);
app.use("/api/v1/password/update", authRateLimitMiddleware);

app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});

// Routes
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);


// Error Handling Middleware
app.use(errorHandleMiddleware);

export default app;

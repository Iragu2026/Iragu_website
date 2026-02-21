import HandleError from "../utils/handleError.js";

const createMemoryRateLimiter = ({ windowMs, maxRequests }) => {
    const store = new Map();

    return (req, res, next) => {
        const now = Date.now();
        const ip = String(
            req.headers["x-forwarded-for"] ||
            req.ip ||
            req.connection?.remoteAddress ||
            "unknown"
        ).split(",")[0].trim();

        const current = store.get(ip);
        if (!current || current.expiresAt <= now) {
            store.set(ip, { count: 1, expiresAt: now + windowMs });
            return next();
        }

        if (current.count >= maxRequests) {
            const retryAfterSeconds = Math.ceil((current.expiresAt - now) / 1000);
            res.setHeader("Retry-After", String(Math.max(retryAfterSeconds, 1)));
            return next(new HandleError("Too many requests. Please try again later.", 429));
        }

        current.count += 1;
        store.set(ip, current);
        return next();
    };
};

// Sensitive auth actions
export const authRateLimitMiddleware = createMemoryRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 30,
});

// Password reset endpoints should be more restrictive
export const passwordResetRateLimitMiddleware = createMemoryRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
});


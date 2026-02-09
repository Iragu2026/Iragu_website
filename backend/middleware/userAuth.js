import handleAsyncError from "./handleAsyncError.js";
import HandleError from "../utils/handleError.js";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import dotenv from "dotenv";
dotenv.config();

export const verifyUserAuth = handleAsyncError(async (req, res, next) => {
    let token = null;

    // 1) Cookie-based auth: cookie-parser puts cookies on req.cookies
    if (req && req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    // 2) Header-based auth: Authorization: Bearer <token>
    if (!token && req && req.headers && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
    }

    if (!token) {
        return next(new HandleError("Please login to access this resource", 401));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    next();
});

// role based access

export const roleBasedAccess = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return next(new HandleError(`Role: ${req.user.role} is not allowed to access this resource`, 403));
        }
        next();
    }
}
import handleAsyncError from "../middleware/handleAsyncError.js";
import User from "../models/userModel.js";
import HandleError from "../utils/handleError.js";
import { sendToken } from "../utils/jwtToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import sharp from "sharp";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { deleteObjectsFromR2, isR2Configured, uploadBufferToR2 } from "../utils/r2Storage.js";
import { assertStrongPassword } from "../utils/passwordPolicy.js";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeName = (value) => String(value || "").trim();
const maskEmailForLogs = (email) => {
    const value = normalizeEmail(email);
    if (!value || !value.includes("@")) return "unknown";
    const [name, domain] = value.split("@");
    const visible = name.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(name.length - 2, 1))}@${domain}`;
};

export const registerUser = handleAsyncError(async (req, res, next) => {
    const name = normalizeName(req.body?.name);
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!name || !email || !password) {
        return next(new HandleError("Name, email and password are required", 400));
    }

    assertStrongPassword(password, "Password");

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new HandleError("Email is already registered", 400));
    }

    await User.create(
        {
            name,
            email,
            password,
            avatar: {
                public_id: "local-avatar-placeholder",
                key: "",
                url: "/images/avatar-image.svg"
            }
        }
    );
    res.status(201).json({
        success: true,
        message: "Account created successfully",
    });
});

// Login User
export const loginUser = handleAsyncError(async (req, res, next) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    if(!email || !password) {
        return next(new HandleError("Email or password cannot be empty", 400));
    }
    const user = await User.findOne({ email }).select("+password");
    if(!user) {
        return next(new HandleError("Invalid email or password", 401));
    }

    const isPasswordCorrect = await user.verifyPassword(password);
    if(!isPasswordCorrect) {
        return next(new HandleError("Invalid email or password", 401));
    }

    sendToken(user, 200, res);
});

// Logout User
export const logoutUser = handleAsyncError(async (req, res, next) => {
    const isProduction = process.env.NODE_ENV === "production";
    const requestedSameSite = String(
        process.env.COOKIE_SAMESITE || (isProduction ? "none" : "lax")
    ).toLowerCase();
    const sameSite = ["lax", "strict", "none"].includes(requestedSameSite)
        ? requestedSameSite
        : "lax";
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: sameSite === "none" ? true : isProduction,
        sameSite,
    });
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});

// Forgot Password
export const requestPasswordReset = handleAsyncError(async (req, res, next) => {
    const email = normalizeEmail(req.body?.email);
    const genericMessage = "If an account exists for this email, reset instructions have been sent.";
    if (!email) {
        return next(new HandleError("Email is required", 400));
    }

    const user = await User.findOne({ email });
    if(!user) {
        console.info(`[auth] forgot-password requested for non-existing email: ${maskEmailForLogs(email)}`);
        return res.status(200).json({
            success: true,
            message: genericMessage,
        });
    }
    const resetToken = user.generateResetPasswordToken();
    await user.save({validateBeforeSave: false});
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetPasswordUrl = `${frontendUrl}/password/reset/${resetToken}`;
    const message = `Use the link below to reset your password:\n\n${resetPasswordUrl}\n\nThis link is valid for only 30 minutes.\n\nIf you did not request this, please ignore this email.`;   
    try {
        console.info(`[auth] forgot-password email sending to ${maskEmailForLogs(user.email)}`);
        await sendEmail({
            email: user.email,
            subject: "Reset Password Request",
            message: message,
        });
        console.info(`[auth] forgot-password email sent to ${maskEmailForLogs(user.email)}`);
        res.status(200).json({
            success: true,
            message: genericMessage,
        });
    }
    catch (error) {
        const code = error?.code ? ` code=${error.code}` : "";
        const responseCode = error?.responseCode ? ` responseCode=${error.responseCode}` : "";
        console.warn(
            `[auth] forgot-password email failed for ${maskEmailForLogs(user.email)}.${code}${responseCode} message=${error?.message || "unknown"}`
        );
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({validateBeforeSave: false});
        return next(new HandleError("Email could not be sent, please try again later", 500));
    }
    
});

// Reset Password
export const resetPassword = handleAsyncError(async (req, res, next) => {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
    if(!user) {
        return next(new HandleError("Reset password token has expired or is invalid", 400));
    }
    const password = String(req.body?.password || "");
    const confirmPassword = String(req.body?.confirmPassword || "");
    if(password !== confirmPassword) {
        return next(new HandleError("Password and confirm password do not match", 400));
    }
    assertStrongPassword(password, "Password");
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({validateBeforeSave: false});
    sendToken(user, 200, res);
});

// Get User Details
export const getUserDetails = handleAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        user: user,
    });
});

// Get Session User (safe for unauthenticated calls; never 401)
export const getSessionUser = handleAsyncError(async (req, res, next) => {
    let token = null;
    if (req?.cookies?.token) token = req.cookies.token;
    if (!token && req?.headers?.authorization) {
        const authHeader = req.headers.authorization;
        if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
    }

    if (!token) {
        return res.status(200).json({ success: true, user: null });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded.id);
        return res.status(200).json({ success: true, user: user || null });
    } catch (error) {
        return res.status(200).json({ success: true, user: null });
    }
});

// Update password
export const updatePassword = handleAsyncError(async (req, res, next) => {
    const oldPassword = String(req.body?.oldPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    const confirmPassword = String(req.body?.confirmPassword || "");
    if (!oldPassword || !newPassword || !confirmPassword) {
        return next(new HandleError("All password fields are required", 400));
    }
    const user = await User.findById(req.user.id).select("+password");
    if(!user) {
        return next(new HandleError("User not found", 404));
    }
    const checkPasswordMatch = await user.verifyPassword(oldPassword);
    if(!checkPasswordMatch) {
        return next(new HandleError("Old password is incorrect", 400));
    }
    if(newPassword !== confirmPassword) {
        return next(new HandleError("Password and confirm password do not match", 400));
    }
    if(oldPassword === newPassword) {
        return next(new HandleError("New password must be different from current password", 400));
    }
    assertStrongPassword(newPassword, "New password");
    user.password = newPassword;
    await user.save();
    sendToken(user, 200, res);
}); 

// Update User Profile
export const updateProfile = handleAsyncError(async (req, res, next) => {
    const name = normalizeName(req.body?.name);
    const email = normalizeEmail(req.body?.email);
    if (!name || !email) {
        return next(new HandleError("Name and email are required", 400));
    }
    const updateUserDetails = { name, email };
    const user = await User.findByIdAndUpdate(req.user.id, updateUserDetails, { new: true, runValidators: true });
    if(!user) {
        return next(new HandleError("User not found", 404));
    }
    res.status(200).json({
        success: true,
        message: "User profile updated successfully",
        user: user,
    });
});

// Update User Avatar
export const updateProfileAvatar = handleAsyncError(async (req, res, next) => {
    if (!isR2Configured()) {
        return next(new HandleError("Cloudflare R2 is not configured in environment", 500));
    }

    if (!req.file) {
        return next(new HandleError("Please upload an avatar image", 400));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new HandleError("User not found", 404));
    }

    const optimizedBuffer = await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 1000, withoutEnlargement: true })
        .webp({
            quality: 80,
            effort: 2,
            smartSubsample: true,
        })
        .toBuffer();

    const key = `avatars/${user._id}-${Date.now()}-${nanoid(8)}.webp`;
    const stored = await uploadBufferToR2({
        key,
        buffer: optimizedBuffer,
        contentType: "image/webp",
    });

    const oldKey = String(user?.avatar?.key || "").trim();

    user.avatar = {
        public_id: key,
        key,
        url: stored.url,
    };

    await user.save({ validateBeforeSave: false });

    if (oldKey) {
        try {
            await deleteObjectsFromR2([oldKey]);
        } catch (error) {
            console.warn("Avatar cleanup failed:", error.message);
        }
    }

    res.status(200).json({
        success: true,
        message: "Profile photo updated successfully",
        user,
    });
});

// Remove User Avatar (revert to default)
export const removeProfileAvatar = handleAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new HandleError("User not found", 404));
    }

    const oldKey = String(user?.avatar?.key || "").trim();

    user.avatar = {
        public_id: "local-avatar-placeholder",
        key: "",
        url: "/images/avatar-image.svg",
    };

    await user.save({ validateBeforeSave: false });

    if (oldKey) {
        try {
            await deleteObjectsFromR2([oldKey]);
        } catch (error) {
            console.warn("Avatar cleanup failed:", error.message);
        }
    }

    res.status(200).json({
        success: true,
        message: "Profile photo removed successfully",
        user,
    });
});

// Get current user's cart
export const getCart = handleAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if(!user) {
        return next(new HandleError("User not found", 404));
    }
    const cart = user.cart || { cartItems: [], orderNote: "", giftWrap: false };
    res.status(200).json({
        success: true,
        cart: {
            cartItems: cart.cartItems || [],
            orderNote: cart.orderNote || "",
            giftWrap: cart.giftWrap === true,
        },
    });
});

// Update current user's cart
export const updateCart = handleAsyncError(async (req, res, next) => {
    const { cartItems, orderNote, giftWrap } = req.body;
    const user = await User.findById(req.user.id);
    if(!user) {
        return next(new HandleError("User not found", 404));
    }
    const safeCartItems = Array.isArray(cartItems)
        ? cartItems.slice(0, 100)
            .map((item) => ({
                product: String(item?.product || "").trim(),
                name: String(item?.name || "").trim(),
                price: Number.isFinite(Number(item?.price)) ? Number(item?.price) : 0,
                image: String(item?.image || "").trim(),
                stock: Number.isFinite(Number(item?.stock)) ? Number(item?.stock) : 0,
                quantity: Math.max(1, Math.min(Number(item?.quantity || 1), 99)),
                size: String(item?.size || "").trim(),
                color: String(item?.color || "").trim(),
                giftWrap: Boolean(item?.giftWrap),
            }))
            .filter((item) => item.product)
        : (user.cart && user.cart.cartItems) || [];

    user.cart = {
        cartItems: safeCartItems,
        orderNote: typeof orderNote === "string" ? orderNote : (user.cart && user.cart.orderNote) || "",
        giftWrap: Boolean(giftWrap),
    };
    await user.save({ validateBeforeSave: false });
    res.status(200).json({
        success: true,
        message: "Cart updated",
        cart: user.cart,
    });
});

// Admin Getting All Users information
export const getAllUsers = handleAsyncError(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users: users,
    });
});

// Admin Get Single User Details
export const getSingleUserDetails = handleAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if(!user) {
        return next(new HandleError("User not found", 404));
    }
    res.status(200).json({
        success: true,
        user: user,
    });
});

// Changing user role
export const updateUserRole = handleAsyncError(async (req, res, next) => {
    const role = String(req.body?.role || "").trim().toLowerCase();
    if(!["user", "admin"].includes(role)) {
        return next(new HandleError("Invalid role value", 400));
    }
    const newUserData = {role};
    const user = await User.findByIdAndUpdate(req.params.id, newUserData, { new: true, runValidators: true });
    if(!user) {
        return next(new HandleError("User not found", 404));
    }
    res.status(200).json({
        success: true,
        message: "User role updated successfully",
        user: user,
    });
});

// Admin Delete User
export const deleteUser = handleAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if(!user) {
        return next(new HandleError("User not found", 404));
    }
    const avatarKey = String(user?.avatar?.key || "").trim();
    await User.findByIdAndDelete(req.params.id);
    if (avatarKey) {
        try {
            await deleteObjectsFromR2([avatarKey]);
        } catch (error) {
            console.warn("Avatar cleanup failed:", error.message);
        }
    }
    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});

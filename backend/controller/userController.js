import { log } from "console";
import handleAsyncError from "../middleware/handleAsyncError.js";
import User from "../models/userModel.js";
import HandleError from "../utils/handleError.js";
import { sendToken } from "../utils/jwtToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

export const registerUser = handleAsyncError(async (req, res, next) => {
    const { name, email, password } = req.body;
    const user = await User.create(
        {
            name,
            email,
            password,
            avatar: {
                public_id: "This is temp avatar",
                url: "This is temp avatar url"
            }
        }
    );
    sendToken(user, 201, res);
});

// Login User
export const loginUser = handleAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    if(!email || !password) {
        return next(new HandleError("Email or password cannot be empty", 400));
    }
    const user = await User.findOne({ email }).select("+password");
    if(!user) {
        return next(new HandleError("User not found", 404));
    }

    const isPasswordCorrect = await user.verifyPassword(password);
    if(!isPasswordCorrect) {
        return next(new HandleError("Invalid email or password", 400));
    }

    sendToken(user, 200, res);
});

// Logout User
export const logoutUser = handleAsyncError(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});

// Forgot Password
export const requestPasswordReset = handleAsyncError(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if(!user) {
        return next(new HandleError("User not found", 404));
    }
    const resetToken = user.generateResetPasswordToken();
    await user.save({validateBeforeSave: false});
    const resetPasswordUrl = `http://localhost/api/v1/password/reset/${resetToken}`;
    const message = `Use the link below to reset your password: ${resetPasswordUrl} \n\nThis link is valid for only 30 minutes. \n\nIf you did not request this, please ignore this email.`;   
    try {
        await sendEmail({
            email: user.email,
            subject: "Reset Password Request",
            message: message,
        });
        res.status(200).json({
            success: true,
            message: `Email has been sent to ${user.email} with instructions to reset your password.`,
        });
    }
    catch (error) {
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
        return next(new HandleError("User not found", 404));
    }
    if(user.resetPasswordExpire < Date.now()) {
        return next(new HandleError("Reset password token has expired or is invalid", 400));
    }
    const {password, confirmPassword} = req.body;
    if(password !== confirmPassword) {
        return next(new HandleError("Password and confirm password do not match", 400));
    }
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

// Update password
export const updatePassword = handleAsyncError(async (req, res, next) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    const checkPasswordMatch = await user.verifyPassword(oldPassword);
    if(!checkPasswordMatch) {
        return next(new HandleError("Old password is incorrect", 400));
    }
    if(newPassword !== confirmPassword) {
        return next(new HandleError("Password and confirm password do not match", 400));
    }
    user.password = newPassword;
    await user.save();
    sendToken(user, 200, res);
}); 

// Update User Profile
export const updateProfile = handleAsyncError(async (req, res, next) => {
    const { name, email } = req.body;
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
    const {role} = req.body;
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
    await user.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});
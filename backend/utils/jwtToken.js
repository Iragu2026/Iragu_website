export const sendToken = (user, statusCode, res) => {
    const token = user.getJWTToken();
    const cookieExpireDays = Number(process.env.JWT_COOKIE_EXPIRE || 7);
    const isProduction = process.env.NODE_ENV === "production";
    const requestedSameSite = String(
        process.env.COOKIE_SAMESITE || (isProduction ? "none" : "lax")
    ).toLowerCase();
    const sameSite = ["lax", "strict", "none"].includes(requestedSameSite)
        ? requestedSameSite
        : "lax";

    // Options for cookie
    const options = {
        expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: sameSite === "none" ? true : isProduction,
        sameSite,
    };

    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        user: user,
        token: token
    });
}

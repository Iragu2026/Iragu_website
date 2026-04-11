import HandleError from "../utils/handleError.js";

export default (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    // Cast Error
    if(err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}: ${err.value}`;
        err = new HandleError(message, 404);
    }

    // Mongoose Duplicate Key Error
    if(err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new HandleError(message, 400);
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        err = new HandleError("Authentication token is invalid. Please login again", 401);
    }
    if (err.name === "TokenExpiredError") {
        err = new HandleError("Authentication token has expired. Please login again", 401);
    }

    // Multer upload errors
    if (err.name === "MulterError") {
        err = new HandleError(err.message, 400);
    }
    if (err.message === "Only image files are allowed") {
        err = new HandleError(err.message, 400);
    }

    // CORS errors
    if (err.message === "Not allowed by CORS") {
        err = new HandleError("Cross-origin request blocked", 403);
    }

    if (process.env.NODE_ENV !== "production") {
        console.error("[Error]", err.message, err.stack);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
};

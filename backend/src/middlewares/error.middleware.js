import AppError from "../utils/appError.js";

export const errorHandler = (err, req, res, next) => {

    console.error("Error:", err);

    const statusCode = err.statusCode || 500;

    const status = err.status || "error";

    const message = err.isOperational
        ? err.message
        : "Internal server error";

    return res.status(statusCode).json({
        success: false,
        status,
        message
    });
};
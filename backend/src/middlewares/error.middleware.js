import AppError from "../utils/appError.js";
import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {

    const log = req.log ?? logger;
    log.error({ err }, "Error:");

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
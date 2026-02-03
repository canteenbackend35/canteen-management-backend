import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";

/**
 * Global error handling middleware for Express.
 */
export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode, message, UImessage } = err;

  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || 500;
    message = err.message || "Internal Server Error";
    UImessage = "An unexpected error occurred.";
  }

  // Use Winston for logging
  logger.error(`🔥 [${req.method} ${req.url}] ${message}`, {
    stack: err.stack,
    statusCode,
  });

  res.status(statusCode).json({
    success: false,
    message,
    UImessage,
  });
};

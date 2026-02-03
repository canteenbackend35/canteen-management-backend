import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
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

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    UImessage = err.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
  } 
  else if (!(err instanceof ApiError)) {
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

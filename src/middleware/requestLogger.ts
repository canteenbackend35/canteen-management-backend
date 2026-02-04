import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";

/**
 * Request logger middleware using Winston
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.get("content-type");
  logger.info(`📌 ${req.method} ${req.originalUrl} - IP: ${req.ip} - Content-Type: ${contentType || "none"}`);

  const hasBody = req.body && Object.keys(req.body).length > 0;
  
  if (hasBody) {
    logger.info(`📦 Body: ${JSON.stringify(req.body, null, 2)}`);
  } else if (["POST", "PUT", "PATCH"].includes(req.method)) {
    logger.info("📦 Body: (empty)");
  }

  next();
};

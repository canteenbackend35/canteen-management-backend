import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";

/**
 * Request logger middleware using Winston
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`📌 ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  if (Object.keys(req.body).length > 0) {
    logger.debug("Body: %o", req.body);
  }
  next();
};

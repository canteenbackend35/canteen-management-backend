import { Request, Response, NextFunction } from "express";

/**
 * Development request logger middleware
 * Logs incoming requests with method, URL, body, and timestamp
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const token = req.headers.authorization || "NO_TOKEN";

  console.log(`📌 [${timestamp}] ${req.method} ${req.originalUrl}`);

  next();
};

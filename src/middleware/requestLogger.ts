import { Request, Response, NextFunction } from "express";

/**
 * Development request logger middleware
 * Logs incoming requests with method, URL, body, and timestamp
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const token = req.headers.authorization || "NO_TOKEN";
  const body = req.body;

  console.log(`📌 [${timestamp}] ${req.method} ${req.originalUrl}`);
  console.log("Body:", body);

  next();
};

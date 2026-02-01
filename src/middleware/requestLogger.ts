import { Request, Response, NextFunction } from "express";

/**
 * Development request logger middleware
 * Logs incoming requests with method, URL, body, and timestamp
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const token = req.headers.authorization || "NO_TOKEN";

  console.log("\n====================================");
  console.log(`📌 [${timestamp}] ${req.method} ${req.originalUrl}`);
  
  // Log request body if present (excluding sensitive fields)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    
    // Hide sensitive fields
    if (sanitizedBody.otp) sanitizedBody.otp = "***";
    if (sanitizedBody.password) sanitizedBody.password = "***";
    if (sanitizedBody.order_otp) sanitizedBody.order_otp = "***";
    
    console.log("📦 Body:", JSON.stringify(sanitizedBody, null, 2));
  }
  
  console.log("====================================\n");

  next();
};

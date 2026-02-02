import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/jwtService.js";

const development = process.env.NODE_ENV === "development";

/**
 * Middleware to authenticate users using JWT Access Token
 */
export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.accessToken || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

    if (!token) {
      if (development) console.log("❌ Authentication failed: No token provided in cookies or headers");
      return res.status(401).json({
        success: false,
        UImessage: "Please log in to access this resource." 
      });
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      if (development) console.log("❌ Authentication failed: Token is invalid or expired");
      return res.status(401).json({ 
        success: false, 
        UImessage: "Session expired. Please log in again." 
      });
    }

    // Attach decoded user info to request
    req.role = decoded.role;
    req.customer_id = decoded.customer_id;
    req.store_id = decoded.store_id;
    
    if (development) console.log(`👤 ${decoded.role} authenticated (ID: ${decoded.customer_id || decoded.store_id})`);
    next();
    
  } catch (err: any) {
    console.error("🔥 Auth middleware error:", err.message);
    return res.status(500).json({ 
      success: false, 
      UImessage: "An error occurred during authentication." 
    });
  }
}

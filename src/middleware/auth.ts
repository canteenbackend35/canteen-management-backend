import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/jwtService.js";

/**
 * Middleware to authenticate users using JWT Access Token
 */
export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Authentication failed: Missing or invalid Authorization header");
      return res.status(401).json({ 
        success: false, 
        UImessage: "Please log in to access this resource." 
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      console.log("❌ Authentication failed: Token is invalid or expired");
      return res.status(401).json({ 
        success: false, 
        UImessage: "Session expired. Please log in again." 
      });
    }

    // Attach decoded user info to request
    req.role = decoded.role;
    req.email = decoded.email;
    req.phone_no = decoded.phone_no;
    req.customer_id = decoded.customer_id;
    req.store_id = decoded.store_id;
    
    console.log(`👤 ${decoded.role} authenticated:`, req.phone_no);
    next();
    
  } catch (err: any) {
    console.error("🔥 Auth middleware error:", err.message);
    return res.status(500).json({ 
      success: false, 
      UImessage: "An error occurred during authentication." 
    });
  }
}

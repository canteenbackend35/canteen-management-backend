import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/jwtService.js";
import logger from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Middleware to authenticate users using JWT Access Token
 */
export const auth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

  if (!token) {
    logger.debug("❌ Authentication failed: No token provided in cookies or headers");
    throw new ApiError(401, "Please log in to access this resource.");
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    logger.debug("❌ Authentication failed: Token is invalid or expired");
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  // Attach decoded user info to request
  req.role = decoded.role;
  req.customer_id = decoded.customer_id;
  req.store_id = decoded.store_id;
  
  logger.debug(`👤 ${decoded.role} authenticated (ID: ${decoded.customer_id || decoded.store_id})`);
  next();
});

import { rateLimit } from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

/**
 * General rate limiter for authentication routes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: new ApiError(429, "Too many requests from this IP, please try again after 15 minutes", "Too many attempts. Please wait 15 minutes."),
});

/**
 * Stricter rate limiter for OTP-related routes.
 */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 OTP requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: new ApiError(429, "Too many OTP requests. Please try again after 10 minutes.", "OTP limit reached. Please wait 10 minutes."),
});

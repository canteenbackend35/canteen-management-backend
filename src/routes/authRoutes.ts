import express from "express";
import { sendOtp, verifyOtp, signup, login, refreshToken, getMe } from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";

import { authLimiter, otpLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

/**
 * Unified Authentication Routes
 * Handles both Customer and Store authentication
 */

router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", otpLimiter, verifyOtp);
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/refresh", authLimiter, refreshToken);
router.get("/me", auth, getMe);

export default router;

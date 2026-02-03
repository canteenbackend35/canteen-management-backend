import express from "express";
import { sendOtp, verifyOtp, signup, login, refreshToken, getMe } from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validateMiddleware.js";
import { sendOtpSchema, verifyOtpSchema, signupSchema, loginSchema } from "../validators/authValidator.js";

import { authLimiter, otpLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

/**
 * Unified Authentication Routes
 * Handles both Customer and Store authentication
 */

router.post("/send-otp", otpLimiter, validate(sendOtpSchema), sendOtp);
router.post("/verify-otp", otpLimiter, validate(verifyOtpSchema), verifyOtp);
router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", authLimiter, refreshToken);
router.get("/me", auth, getMe);

export default router;

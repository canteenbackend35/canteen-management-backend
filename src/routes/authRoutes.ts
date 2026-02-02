import express from "express";
import { sendOtp, verifyOtp, signup, login, refreshToken, getMe } from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/**
 * Unified Authentication Routes
 * Handles both Customer and Store authentication
 */

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.get("/me", auth, getMe);

export default router;

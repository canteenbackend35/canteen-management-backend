import express from "express";
import {
  getUserOrders,
  signUpUser,
  sendOtp,
  verifyOtp,
  refreshToken,
  getUserProfile,
  loginUser,
} from "../controllers/userController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/**
 * Public Routes
 */
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/signup", signUpUser);
router.post("/refresh", refreshToken);


router.post("/login", loginUser);
/**
 * Private Routes (Authenticated)
*/
router.get("/orders", auth, getUserOrders);
router.get("/profile", auth, getUserProfile);

export default router;

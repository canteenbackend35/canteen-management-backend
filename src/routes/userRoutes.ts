import express from "express";
import {
  getUserOrders,
  loginUser,
  signUpUser,
	sendOtp
} from "../controllers/userController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/signup", signUpUser);
router.get("/orders", auth, getUserOrders);
router.post("/send-otp", sendOtp);

export default router;

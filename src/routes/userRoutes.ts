import express from "express";
import { getUserOrders } from "../controllers/userController.js";
import { sendOtp } from "../controllers/userController.js";

const router = express.Router();

//router.get("/:userId/orders", getUserOrders);
router.post("/send-otp", sendOtp);

export default router;

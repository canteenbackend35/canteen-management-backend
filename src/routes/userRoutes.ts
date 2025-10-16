import express from "express";
import { getUserOrders, validateOtp } from "../controllers/userController.js";

const router = express.Router();

// router.post("/signup", signupUser);
// router.post("/login", loginUser);
router.get("/:userId/orders", getUserOrders);
router.post("/validateOtp", validateOtp);

export default router;

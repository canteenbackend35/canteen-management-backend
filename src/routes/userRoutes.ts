import express from "express";
import { getUserOrders } from "../controllers/userController.js";

const router = express.Router();

// router.post("/signup", signupUser);
// router.post("/login", loginUser);
router.get("/:userId/orders", getUserOrders);

export default router;

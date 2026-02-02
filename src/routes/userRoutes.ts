import express from "express";
import { getUserOrders } from "../controllers/userController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// All user routes require authentication
router.get("/orders", auth, getUserOrders);

export default router;

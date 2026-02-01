import express from "express";
import {
  createOrder,
  getOrder,
  getOrderStatus,
  verifyOrder,
  completeOrder,
  cancelOrder
} from "../controllers/orderController.js";

import { auth } from "../middleware/auth.js";

const router = express.Router();

// Middleware to check if user is a store
const isStore = (req: any, res: any, next: any) => {
  if (req.role !== 'store') {
    return res.status(403).json({ success: false, UImessage: "Access denied. Only stores can perform this action." });
  }
  next();
};

// Middleware to check if user is a customer
const isCustomer = (req: any, res: any, next: any) => {
  if (req.role !== 'customer') {
    return res.status(403).json({ success: false, UImessage: "Access denied. Only customers can perform this action." });
  }
  next();
};

// --- ROUTES ---
router.post("/", auth, isCustomer, createOrder);
router.get("/:orderId", auth, getOrder);
router.get("/:orderId/status", auth, getOrderStatus);

// Store-only actions
router.post("/:orderId/verify", auth, isStore, verifyOrder);
router.patch("/:orderId/complete", auth, isStore, completeOrder);
router.patch("/:orderId/cancel", auth, cancelOrder);

export default router;

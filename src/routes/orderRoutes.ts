import express from "express";
import {
  createOrder,
  getOrder,
  getOrderStatus,
  verifyOrder,
  confirmOrder,
  prepareOrder,
  readyOrder,
  completeOrder,
  cancelOrder
} from "../controllers/orderController.js";

import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validateMiddleware.js";
import { 
  createOrderSchema, 
  verifyOrderSchema, 
  orderIdSchema 
} from "../validators/orderValidator.js";

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
router.post("/", auth, isCustomer, validate(createOrderSchema), createOrder);
router.get("/:orderId", auth, validate(orderIdSchema), getOrder);
router.get("/:orderId/status", auth, validate(orderIdSchema), getOrderStatus);

// Store-only actions
router.post("/:orderId/verify", auth, isStore, validate(verifyOrderSchema), verifyOrder);
router.patch("/:orderId/confirm", auth, isStore, validate(orderIdSchema), confirmOrder);
router.patch("/:orderId/prepare", auth, isStore, validate(orderIdSchema), prepareOrder);
router.patch("/:orderId/ready", auth, isStore, validate(orderIdSchema), readyOrder);
router.patch("/:orderId/complete", auth, isStore, validate(orderIdSchema), completeOrder);
router.patch("/:orderId/cancel", auth, validate(orderIdSchema), cancelOrder);

export default router;

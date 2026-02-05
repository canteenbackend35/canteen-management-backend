import express from "express";
import {
  cancelOrder,
  completeOrder,
  confirmOrder,
  createOrder,
  getOrder,
  getOrderStatus,
  prepareOrder,
  readyOrder,
  verifyOrder,
  watchOrderStatus
} from "../controllers/orderController.js";

import { auth } from "../middleware/auth.js";
import { isCustomer, isStore } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import {
  createOrderSchema,
  orderIdSchema,
  verifyOrderSchema
} from "../validators/orderValidator.js";

const router = express.Router();

// --- ROUTES ---
router.post("/", auth, isCustomer, validate(createOrderSchema), createOrder);
router.get("/:orderId", auth, validate(orderIdSchema), getOrder);
router.get("/:orderId/status", auth, validate(orderIdSchema), getOrderStatus);
router.get("/:orderId/watch", auth, validate(orderIdSchema), watchOrderStatus);

// Store-only actions
router.post("/:orderId/verify", auth, isStore, validate(verifyOrderSchema), verifyOrder);
router.patch("/:orderId/confirm", auth, isStore, validate(orderIdSchema), confirmOrder);
router.patch("/:orderId/prepare", auth, isStore, validate(orderIdSchema), prepareOrder);
router.patch("/:orderId/ready", auth, isStore, validate(orderIdSchema), readyOrder);
// cancelOrder can be accessed by both, but usually verified by store or customer. 
// Adding roles specifically if needed, but for now keeping it as is or clarifying if it's store only.
router.patch("/:orderId/complete", auth, isStore, validate(orderIdSchema), completeOrder);
router.patch("/:orderId/cancel", auth, validate(orderIdSchema), cancelOrder);

export default router;

import express from "express";
import {
  createOrder,
  getOrder,
  getOrderStatus,
  verifyOrder,
  completeOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/:orderId", getOrder);
router.get("/:orderId/status", getOrderStatus);
router.post("/:orderId/verify", verifyOrder);
router.patch("/:orderId/complete", completeOrder);

export default router;

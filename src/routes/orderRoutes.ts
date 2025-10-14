import express from "express";
import {
  createOrder,
  getOrder,
  getOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/:orderId", getOrder);
router.get("/:orderId/status", getOrderStatus);

export default router;

import { OrderStatus } from "@prisma/client";
import express from "express";
import * as OrderService from "../services/orderService.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";
import { orderEvents } from "../utils/orderEvents.js";


// Create order
export const createOrder = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { store_id, payment_id, items } = req.body;
  const customerId = req.customer_id;
  
  const order = await OrderService.createOrder({
    customer_id: customerId,
    store_id,
    payment_id,
    items
  });

  res.status(201).json({ 
    success: true,
    UImessage: "Order placed successfully!",
    order
  });
});

// Get order details
export const getOrder = asyncHandler(async (req: express.Request, res: express.Response) => {
  const orderId = parseInt(req.params.orderId!, 10);
  const order = await OrderService.getOrderById(orderId);

  if (!order) throw new ApiError(404, "Order not found");

  if (req.customer_id !== order.customer_id && req.store_id !== order.store_id) {
    throw new ApiError(403, "Access denied.");
  }

  return res.json({ success: true, order });
});

// Get order status
export const getOrderStatus = asyncHandler(async (req: express.Request, res: express.Response) => {
  const orderId = parseInt(req.params.orderId!, 10);
  const order = await OrderService.getOrderById(orderId);

  if (!order) throw new ApiError(404, "Order not found");

  if (req.customer_id !== order.customer_id && req.store_id !== order.store_id) {
    throw new ApiError(403, "Access denied.");
  }

  return res.json({ success: true, order_status: order.order_status });
});

/**
 * @desc    SSE Stream for order status updates
 */
export const watchOrderStatus = (req: express.Request, res: express.Response) => {
  const orderId = parseInt(req.params.orderId!, 10);

  // Headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send initial connected comment
  res.write(`: connected\n\n`);

  // Listener for status updates
  const statusListener = (status: OrderStatus) => {
    res.write(`data: ${JSON.stringify({ order_id: orderId, status })}\n\n`);
  };

  // Heartbeat to keep connection alive on Render (every 30 seconds)
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  orderEvents.on(`orderUpdate-${orderId}`, statusListener);

  // Clean up on client disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    orderEvents.off(`orderUpdate-${orderId}`, statusListener);
    res.end();
  });
};

/**
 * @desc    Verify order with OTP
 */
export const verifyOrder = asyncHandler(async (req: express.Request, res: express.Response) => {
  const orderId = parseInt(req.params.orderId!, 10);
  const { order_otp } = req.body;
  const storeId = req.store_id;

  if (!storeId) throw new ApiError(401, "Unauthorized.");

  const order = await OrderService.getOrderById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.store_id !== storeId) throw new ApiError(403, "Access denied.");
  if (order.order_otp !== order_otp.toString()) throw new ApiError(400, "Invalid OTP");

  const updatedOrder = await OrderService.updateOrderStatus(orderId, OrderStatus.DELIVERED);

  return res.json({ success: true, UImessage: "Order verified!", order: updatedOrder });
});

/**
 * @desc    Confirm order
 */
export const confirmOrder = asyncHandler(async (req: express.Request, res: express.Response) => {
  const orderId = parseInt(req.params.orderId!, 10);
  const storeId = req.store_id;
  logger.debug(orderId);
  const order = await OrderService.getOrderById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.store_id !== storeId) throw new ApiError(403, "Access denied.");
  if (order.order_status !== OrderStatus.PENDING) throw new ApiError(400, "Invalid state.");

  const updatedOrder = await OrderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED);
  return res.json({ success: true, UImessage: "Order confirmed!", order: updatedOrder });
});

/**
 * @desc    Start preparing
 */
export const prepareOrder = asyncHandler(async (req: express.Request, res: express.Response) => {
  const orderId = parseInt(req.params.orderId!, 10);
  const storeId = req.store_id;

  const order = await OrderService.getOrderById(orderId);
  if (!order || order.store_id !== storeId) throw new ApiError(404, "Order not found or unauthorized.");
  if (order.order_status !== OrderStatus.CONFIRMED) throw new ApiError(400, "Must be confirmed.");

  const updatedOrder = await OrderService.updateOrderStatus(orderId, OrderStatus.PREPARING);
  return res.json({ success: true, UImessage: "Order preparing!", order: updatedOrder });
});

/**
 * @desc    Mark as ready
 */
export const readyOrder = asyncHandler(async (req: express.Request, res: express.Response) => {
  const orderId = parseInt(req.params.orderId!, 10);
  const storeId = req.store_id;

  const order = await OrderService.getOrderById(orderId);
  if (!order || order.store_id !== storeId) throw new ApiError(404, "Order not found or unauthorized.");
  if (order.order_status !== OrderStatus.PREPARING) throw new ApiError(400, "Must be preparing.");

  const updatedOrder = await OrderService.updateOrderStatus(orderId, OrderStatus.READY);
  return res.json({ success: true, UImessage: "Order ready!", order: updatedOrder });
});

/**
 * @desc    Complete order
 */
export const completeOrder = asyncHandler(async (req: express.Request, res: express.Response) => {
  const orderId = parseInt(req.params.orderId!, 10);
  const storeId = req.store_id;

  const order = await OrderService.getOrderById(orderId);
  if (!order || order.store_id !== storeId) throw new ApiError(404, "Order not found or unauthorized.");
  if (order.order_status !== OrderStatus.READY) throw new ApiError(400, "Must be ready.");

  const updatedOrder = await OrderService.updateOrderStatus(orderId, OrderStatus.DELIVERED);
  return res.json({ success: true, UImessage: "Order completed!", order: updatedOrder });
});

/**
 * @desc    Cancel order
 */
export const cancelOrder = asyncHandler(async (req: express.Request, res: express.Response) => {
  const orderId = parseInt(req.params.orderId!, 10);
  const { customer_id, store_id } = req;

  const order = await OrderService.getOrderById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  const isOwner = customer_id === order.customer_id;
  const isTargetStore = store_id === order.store_id;
  if (!isOwner && !isTargetStore) throw new ApiError(403, "Access denied.");

  if (order.order_status === OrderStatus.DELIVERED) throw new ApiError(400, "Cannot cancel completed order.");
  if (isOwner && order.order_status !== OrderStatus.PENDING) throw new ApiError(400, "Cannot cancel after confirmation.");

  const updatedOrder = await OrderService.updateOrderStatus(orderId, OrderStatus.CANCELLED);
  return res.json({ success: true, UImessage: "Order cancelled.", order: updatedOrder });
});

/**
 * @desc    SSE Stream for store to watch NEW orders
 */
export const watchStoreOrders = (req: express.Request, res: express.Response) => {
  logger.debug("📡 SSE Connection Request to /stores/orders/watch");
  logger.debug("Auth - Role:", req.role);
  logger.debug("Auth - Store ID:", req.store_id);
  logger.debug("Cookies received:", Object.keys(req.cookies || {}).join(', ') || 'NONE');
  logger.debug("Headers - Origin:", req.headers.origin);
  logger.debug("Headers - User-Agent:", req.headers['user-agent']);
  
  const storeId = req.store_id;

  if (!storeId) {
    logger.warn("⚠️ Unauthorized Store Watch attempt - Missing store_id");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.write(`: connected\n\n`);
  logger.info(`🔌 Store ${storeId} connected to real-time updates`);

  // Listener for NEW orders
  const newOrderListener = (order: any) => {
    logger.info(`🔔 Sending NEW_ORDER ${order.order_id} to Store ${storeId}`);
    res.write(`data: ${JSON.stringify({ type: "NEW_ORDER", order })}\n\n`);
  };

  // Listener for Order Updates (Status)
  const orderUpdateListener = (data: any) => {
    logger.info(`🔄 Sending ORDER_UPDATE ${data.order_id} to Store ${storeId}`);
    res.write(`data: ${JSON.stringify({ type: "ORDER_UPDATE", ...data })}\n\n`);
  };

  // Heartbeat
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  const eventKey = String(storeId);
  orderEvents.on(`newOrder-${eventKey}`, newOrderListener);
  orderEvents.on(`orderUpdate-${eventKey}`, orderUpdateListener);

  req.on("close", () => {
    logger.info(`🔌 Store ${storeId} disconnected`);
    clearInterval(heartbeat);
    orderEvents.off(`newOrder-${eventKey}`, newOrderListener);
    orderEvents.off(`orderUpdate-${eventKey}`, orderUpdateListener);
    res.end();
  });
};

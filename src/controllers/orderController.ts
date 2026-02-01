import { Request, Response } from "express";
import prisma from "../config/prisma_client.js";
import { generateNumericOtp } from "../services/otpService.js";

// Create order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { customer_id, store_id, payment_id, items } = req.body;

    // Use current authenticated user if possible
    const effectiveCustomerId = req.customer_id || customer_id;
    
    if (!effectiveCustomerId) {
      return res.status(400).json({ success: false, UImessage: "Customer ID is required." });
    }

    // Calculate total price
    let total_price = 0;
    for (const i of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { menu_item_id: i.menu_item_id },
      });
      if (!menuItem) {
        return res.status(400).json({
          error: "Menu item not found",
          menu_item_id: i.menu_item_id,
        });
      }
      total_price += menuItem.price * i.quantity;
    }

    // Generate secure 4-digit OTP for this order (in-app only, not sent via MSG91)
    const order_otp = generateNumericOtp(4);
    console.log(`🔢 Generated Order OTP: ${order_otp} (Display this on user frontend)`);
    
    // Create order
    const order = await prisma.order.create({
      data: {
        total_price,
        payment_id,
        order_otp,
        customer: { connect: { customer_id: effectiveCustomerId } },
        store: { connect: { store_id } },
      },
    });

    // Insert order items
    for (const i of items) {
      await prisma.orderItem.create({
        data: {
          order_id: order.order_id,
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
        },
      });
    }

    console.log(`✅ Order created successfully - ID: ${order.order_id}, OTP: ${order_otp}`);
    res.status(201).json({ 
      success: true,
      UImessage: "Order placed successfully!",
      order: { ...order, items },
      order_otp 
    });
  } catch (err) {
    console.error("🔥 createOrder Error:", err);
    res.status(500).json({ success: false, UImessage: "Failed to create order", details: err });
  }
};

// Get order details
export const getOrder = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId!, 10);
    const order = await prisma.order.findUnique({
      where: { order_id: orderId },
      include: {
        items: { include: { menu_item: true } },
        store: true,
        customer: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, UImessage: "Order not found" });
    }

    // Security Check: Is this the customer who placed it or the store that received it?
    const isOwner = req.customer_id === order.customer_id;
    const isTargetStore = req.store_id === order.store_id;

    if (!isOwner && !isTargetStore) {
      return res.status(403).json({ success: false, UImessage: "Access denied. You are not authorized to view this order." });
    }

    return res.json({ success: true, order });
  } catch (err) {
    console.error("🔥 getOrder Error:", err);
    return res.status(500).json({ success: false, UImessage: "Failed to fetch order" });
  }
};

// Get order status
export const getOrderStatus = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId!, 10);
    const order = await prisma.order.findUnique({
      where: { order_id: orderId },
      select: { order_status: true, customer_id: true, store_id: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, UImessage: "Order not found" });
    }

    // Security Check
    if (req.customer_id !== order.customer_id && req.store_id !== order.store_id) {
      return res.status(403).json({ success: false, UImessage: "Access denied." });
    }

    return res.json({ success: true, order_status: order.order_status });
  } catch (err) {
    console.error("🔥 getOrderStatus Error:", err);
    return res.status(500).json({ success: false, UImessage: "Failed to fetch order status" });
  }
};

/**
 * @desc    Verify order with OTP (Store Frontend)
 * @route   POST /orders/:orderId/verify
 * @access  Private (Store verifies customer's OTP)
 */
export const verifyOrder = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId!, 10);
    const { order_otp } = req.body;
    const storeId = req.store_id;

    if (!storeId) {
      return res.status(401).json({ success: false, UImessage: "Unauthorized. Store identity missing." });
    }

    if (!order_otp) {
      return res.status(400).json({ success: false, UImessage: "OTP is required" });
    }

    const order = await prisma.order.findUnique({
      where: { order_id: orderId },
    });

    if (!order) {
      return res.status(404).json({ success: false, UImessage: "Order not found" });
    }

    // Security Check: Does this order belong to THIS store?
    if (order.store_id !== storeId) {
      return res.status(403).json({ success: false, UImessage: "Access denied. This order belongs to another store." });
    }

    if (order.order_otp !== order_otp.toString()) {
      return res.status(400).json({ success: false, UImessage: "Invalid OTP" });
    }

    const updatedOrder = await prisma.order.update({
      where: { order_id: orderId },
      data: { order_status: "CONFIRMED" },
    });

    return res.json({ 
      success: true, 
      UImessage: "Order verified successfully!",
      order: updatedOrder 
    });
  } catch (err) {
    console.error("🔥 verifyOrder Error:", err);
    return res.status(500).json({ success: false, UImessage: "Failed to verify order" });
  }
};

/**
 * @desc    Mark order as completed (Store only)
 * @route   PATCH /orders/:orderId/complete
 * @access  Private (Store only)
 */
export const completeOrder = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId!, 10);
    const storeId = req.store_id;

    if (!storeId) {
      return res.status(401).json({ success: false, UImessage: "Unauthorized." });
    }

    const order = await prisma.order.findUnique({
      where: { order_id: orderId },
    });

    if (!order) {
      return res.status(404).json({ success: false, UImessage: "Order not found" });
    }

    // Security Check
    if (order.store_id !== storeId) {
      return res.status(403).json({ success: false, UImessage: "Access denied." });
    }

    if (order.order_status === "CANCELLED") {
      return res.status(400).json({ success: false, UImessage: "Cannot complete a cancelled order" });
    }

    if (order.order_status === "DELIVERED") {
      return res.status(200).json({ success: true, UImessage: "Order already completed" });
    }

    const completedOrder = await prisma.order.update({
      where: { order_id: orderId },
      data: { order_status: "DELIVERED" },
    });

    return res.json({ 
      success: true, 
      UImessage: "Order completed successfully!",
      order: completedOrder 
    });
  } catch (err) {
    console.error("🔥 completeOrder Error:", err);
    return res.status(500).json({ success: false, UImessage: "Failed to complete order" });
  }
};

/**
 * @desc    Cancel an order (Customer or Store)
 * @route   PATCH /orders/:orderId/cancel
 * @access  Private
 */
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId!, 10);
    const { customer_id, store_id } = req;

    const order = await prisma.order.findUnique({
      where: { order_id: orderId },
    });

    if (!order) {
      return res.status(404).json({ success: false, UImessage: "Order not found" });
    }

    // Security Check
    const isOwner = customer_id === order.customer_id;
    const isTargetStore = store_id === order.store_id;

    if (!isOwner && !isTargetStore) {
      return res.status(403).json({ success: false, UImessage: "Access denied." });
    }

    // State Validation
    if (order.order_status === "DELIVERED") {
      return res.status(400).json({ success: false, UImessage: "Cannot cancel a completed order." });
    }
    
    if (order.order_status === "CANCELLED") {
      return res.status(200).json({ success: true, UImessage: "Order is already cancelled." });
    }

    // Customer can only cancel if PENDING
    if (isOwner && order.order_status !== "PENDING") {
      return res.status(400).json({ success: false, UImessage: "Order cannot be cancelled after it has been confirmed by the store." });
    }

    const cancelledOrder = await prisma.order.update({
      where: { order_id: orderId },
      data: { order_status: "CANCELLED" },
    });

    return res.json({ 
      success: true, 
      UImessage: "Order cancelled successfully.",
      order: cancelledOrder 
    });
  } catch (err) {
    console.error("🔥 cancelOrder Error:", err);
    return res.status(500).json({ success: false, UImessage: "Failed to cancel order." });
  }
};

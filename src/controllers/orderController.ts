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
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order", details: err });
  }
};

// Get order status
export const getOrderStatus = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId!, 10);
    const order = await prisma.order.findUnique({
      where: { order_id: orderId },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ order_status: order.order_status });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch order status", details: err });
  }
};

/**
 * @desc    Verify order with OTP (Store Frontend)
 * @route   POST /orders/:orderId/verify
 * @access  Public (Store verifies customer's OTP)
 */
export const verifyOrder = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId!, 10);
    const { order_otp } = req.body;

    console.log(`🔍 Verifying order #${orderId} with OTP...`);

    if (!order_otp) {
      return res.status(400).json({ success: false, UImessage: "OTP is required" });
    }

    // Fetch order from database
    const order = await prisma.order.findUnique({
      where: { order_id: orderId },
    });

    if (!order) {
      console.log(`❌ Order #${orderId} not found`);
      return res.status(404).json({ success: false, UImessage: "Order not found" });
    }

    // Verify OTP
    if (order.order_otp !== order_otp.toString()) {
      console.log(`❌ Invalid OTP for order #${orderId}`);
      return res.status(400).json({ success: false, UImessage: "Invalid OTP" });
    }

    // Update order status to CONFIRMED
    const updatedOrder = await prisma.order.update({
      where: { order_id: orderId },
      data: { order_status: "CONFIRMED" },
    });

    console.log(`✅ Order #${orderId} verified successfully!`);
    res.json({ 
      success: true, 
      UImessage: "Order verified successfully!",
      order: updatedOrder 
    });
  } catch (err) {
    console.error("🔥 verifyOrder Error:", err);
    res.status(500).json({ success: false, UImessage: "Failed to verify order", details: err });
  }
};

/**
 * @desc    Mark order as completed (Store only)
 * @route   PATCH /orders/:orderId/complete
 * @access  Public (Should be protected with store auth in production)
 */
export const completeOrder = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId!, 10);

    console.log(`📦 Marking order #${orderId} as completed...`);

    const order = await prisma.order.findUnique({
      where: { order_id: orderId },
    });

    if (!order) {
      console.log(`❌ Order #${orderId} not found`);
      return res.status(404).json({ success: false, UImessage: "Order not found" });
    }

    // Check if order is in a valid state to be completed
    if (order.order_status === "CANCELLED") {
      return res.status(400).json({ 
        success: false, 
        UImessage: "Cannot complete a cancelled order" 
      });
    }

    if (order.order_status === "DELIVERED") {
      return res.status(400).json({ 
        success: false, 
        UImessage: "Order already completed" 
      });
    }

    // Update order status to DELIVERED (completed)
    const completedOrder = await prisma.order.update({
      where: { order_id: orderId },
      data: { order_status: "DELIVERED" },
    });

    console.log(`✅ Order #${orderId} marked as completed!`);
    res.json({ 
      success: true, 
      UImessage: "Order completed successfully!",
      order: completedOrder 
    });
  } catch (err) {
    console.error("🔥 completeOrder Error:", err);
    res.status(500).json({ success: false, UImessage: "Failed to complete order", details: err });
  }
};

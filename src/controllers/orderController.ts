import { Request, Response } from "express";
import prisma from "../config/prisma_client.js";

// Create order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { customer_id, store_id, payment_id, items } = req.body;

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

    // Create order
    const order_otp = "12345";
    const order = await prisma.order.create({
      data: {
        total_price,
        payment_id,
        order_otp,
        customer: { connect: { customer_id } },
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

    res.status(201).json({ ...order, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create order", details: err });
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

import prisma from "../config/prisma_client.js";
import { OrderStatus } from "@prisma/client";
import { ApiError } from "../utils/ApiError.js";
import { generateNumericOtp } from "../services/otpService.js";

/**
 * Service to handle all order-related business logic.
 */
export const createOrder = async (data: { customer_id: number, store_id: number, payment_id?: string, items: any[] }) => {
  const { customer_id, store_id, payment_id, items } = data;

  // Calculate total price - Optimized to avoid N+1 queries
  const menuItemIds = items.map((i: any) => i.menu_item_id);
  const menuItems = await prisma.menuItem.findMany({
    where: { menu_item_id: { in: menuItemIds } },
  });

  if (menuItems.length !== items.length) {
    throw new ApiError(400, "One or more menu items not found.");
  }

  const menuItemMap = new Map(menuItems.map(item => [item.menu_item_id, item]));

  let total_price = 0;
  for (const i of items) {
    const menuItem = menuItemMap.get(i.menu_item_id);
    if (!menuItem) throw new ApiError(400, `Menu item not found: ${i.menu_item_id}`);
    total_price += menuItem.price * i.quantity;
  }

  const order_otp = generateNumericOtp(4);

  // Use a transaction to ensure atomicity
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        total_price,
        payment_id: payment_id || null,
        order_otp,
        customer: { connect: { customer_id } },
        store: { connect: { store_id } },
      },
    });

    await tx.orderItem.createMany({
      data: items.map((i: any) => ({
        order_id: order.order_id,
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
      })),
    });

    return { ...order, items };
  });
};

export const getOrderById = async (orderId: number) => {
  return prisma.order.findUnique({
    where: { order_id: orderId },
    include: {
      items: { include: { menu_item: true } },
      store: true,
      customer: true,
    },
  });
};

export const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
  return prisma.order.update({
    where: { order_id: orderId },
    data: { order_status: status },
  });
};

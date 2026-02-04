import { z } from "zod";
import { orderIdParam, otpSchema } from "./common.js";

/**
 * Schema for creating a new order
 */
export const createOrderSchema = z.object({
  body: z.object({
    customer_id: z.number().int().positive().optional(),
    store_id: z.number().int().positive(),
    payment_id: z.string().optional(),
    items: z.array(
      z.object({
        menu_item_id: z.number().int().positive(),
        quantity: z.number().int().positive(),
      })
    ).min(1, "At least one item is required"),
  }),
});

/**
 * Schema for verifying an order with OTP
 */
export const verifyOrderSchema = z.object({
  params: orderIdParam,
  body: z.object({
    order_otp: otpSchema(4),
  }),
});

/**
 * Schema for basic order ID operations
 */
export const orderIdSchema = z.object({
  params: orderIdParam,
});

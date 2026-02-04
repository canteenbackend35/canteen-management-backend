import { z } from "zod";

/**
 * Reusable Basic Schemas
 */
export const phoneSchema = z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits");

export const roleSchema = z.string().refine((val) => val === "customer" || val === "store", {
  message: "Role must be 'customer' or 'store'",
});

export const numericIdSchema = z.string().regex(/^\d+$/, "ID must be a numeric string");

export const otpSchema = (length: number = 4) => 
  z.string().length(length, `OTP must be exactly ${length} digits`);

/**
 * Reusable Param Objects
 */
export const orderIdParam = z.object({
  orderId: numericIdSchema,
});

export const itemIdParam = z.object({
  itemId: numericIdSchema,
});

export const storeIdParam = z.object({
  storeId: numericIdSchema,
});

import { z } from "zod";
import { itemIdParam } from "./common.js";

/**
 * Schema for common menu item fields
 */
const menuItemBodySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  price: z.coerce.number().positive("Price must be a positive number"),
  status: z.preprocess(
    (val) => (typeof val === "string" ? val.toUpperCase() : val),
    z.enum(["AVAILABLE", "OUT_OF_STOCK"])
  ).optional(),
});

/**
 * Schema for adding a menu item
 */
export const addMenuItemSchema = z.object({
  body: menuItemBodySchema,
});

/**
 * Schema for updating a menu item
 */
export const updateMenuItemSchema = z.object({
  params: itemIdParam,
  body: menuItemBodySchema.partial(),
});

/**
 * Schema for menu item ID verification
 */
export const menuItemIdSchema = z.object({
  params: itemIdParam,
});

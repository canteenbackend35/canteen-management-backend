import { z } from "zod";
import { itemIdParam } from "./common.js";

/**
 * Schema for common menu item fields
 */
const menuItemBodySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  price: z.coerce.number().positive("Price must be a positive number"),
  status: z.enum(["available", "unavailable"]).optional(),
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
export const updateMenuItemSchema = itemIdParam.extend({
  body: menuItemBodySchema.partial(),
});

/**
 * Schema for menu item ID verification
 */
export const menuItemIdSchema = itemIdParam;

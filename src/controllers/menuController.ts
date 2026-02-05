import express from "express";
import prisma from "../config/prisma_client.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc    Add menu item to the authenticated store
 * @route   POST /menu
 * @access  Private (Store only)
 */
export const addMenuItem = asyncHandler(async (req: express.Request, res: express.Response) => {
  const storeId = req.store_id; // From auth middleware
  const { name, price } = req.body;

  if (!storeId) {
    throw new ApiError(401, "Unauthorized. Store ID missing.");
  }

  const item = await prisma.menuItem.create({
    data: { 
      store_id: storeId, 
      name, 
      price: parseFloat(price) 
    },
  });

  return res.status(201).json({
    success: true,
    UImessage: "Menu item added successfully!",
    item
  });
});

/**
 * @desc    Update a menu item belonging to the authenticated store
 * @route   PUT /menu/:itemId
 * @access  Private (Store only)
 */
export const updateMenuItem = asyncHandler(async (req: express.Request, res: express.Response) => {
  const storeId = req.store_id;
  const itemId = parseInt(req.params.itemId!, 10);
  const { name, price, status } = req.body;

  if (!storeId) {
    throw new ApiError(401, "Unauthorized.");
  }

  // Security Check: Ensure item belongs to this store
  const existingItem = await prisma.menuItem.findUnique({ where: { menu_item_id: itemId } });
  if (!existingItem || existingItem.store_id !== storeId) {
    throw new ApiError(403, "Access denied. This item does not belong to your store.");
  }

  const item = await prisma.menuItem.update({
    where: { menu_item_id: itemId },
    data: { 
      ...(name && { name }), 
      ...(price && { price: parseFloat(price) }), 
      ...(status && { status }) 
    },
  });

  return res.json({
    success: true,
    UImessage: "Menu item updated successfully!",
    item
  });
});

/**
 * @desc    Delete a menu item belonging to the authenticated store
 * @route   DELETE /menu/:itemId
 * @access  Private (Store only)
 */
export const deleteMenuItem = asyncHandler(async (req: express.Request, res: express.Response) => {
  const storeId = req.store_id;
  const itemId = parseInt(req.params.itemId!, 10);

  if (!storeId) {
    throw new ApiError(401, "Unauthorized.");
  }

  // Security Check: Ensure item belongs to this store
  const existingItem = await prisma.menuItem.findUnique({ where: { menu_item_id: itemId } });
  if (!existingItem || existingItem.store_id !== storeId) {
    throw new ApiError(403, "Access denied.");
  }

  // Check if item is linked to any orders (prevents Foreign Key crash)
  const orderCount = await prisma.orderItem.count({
    where: { menu_item_id: itemId }
  });

  if (orderCount > 0) {
    throw new ApiError(400, "Cannot delete item with order history. Please set it to 'OUT_OF_STOCK' instead.");
  }

  await prisma.menuItem.delete({ where: { menu_item_id: itemId } });
  
  return res.status(200).json({
    success: true,
    UImessage: "Menu item deleted successfully."
  });
});

import express from "express";
import prisma from "../config/prisma_client.js";
import * as StoreService from "../services/storeService.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc    List all stores
 * @route   GET /stores
 * @access  Public
 */
export const listStores = asyncHandler(async (req: express.Request, res: express.Response) => {
  const stores = await prisma.store.findMany();
  res.json(stores);
});

/**
 * @desc    Get Store Menu
 * @route   GET /stores/:storeId/menu
 * @access  Public
 */
export const getStoreMenu = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { storeId: storeIdParam } = req.params;
  const storeId = parseInt(storeIdParam!, 10);

  const menu = await prisma.menuItem.findMany({
    where: { store_id: storeId },
  });
  res.json(menu);
});

/**
 * @desc    Get Store Orders
 * @route   GET /stores/orders
 * @access  Private (Store only)
 */
export const getStoreOrders = asyncHandler(async (req: express.Request, res: express.Response) => {
  const storeId = req.store_id;

  if (!storeId) {
    throw new ApiError(401, "Unauthorized.");
  }

  const orders = await StoreService.getStoreOrdersWithDetails(storeId);

  return res.json({
    success: true,
    UImessage: orders.length > 0 ? `Successfully fetched ${orders.length} orders.` : "No orders found.",
    orders
  });
});

/**
 * @desc    Update Store Status (OPEN/CLOSED)
 * @route   PATCH /stores/status
 * @access  Private (Store only)
 */
export const updateStoreStatus = asyncHandler(async (req: express.Request, res: express.Response) => {
  const storeId = req.store_id;
  const { status } = req.body;

  if (!storeId) {
    throw new ApiError(401, "Unauthorized.");
  }

  const updatedStore = await prisma.store.update({
    where: { store_id: storeId },
    data: { status: status as any },
  });

  return res.json({
    success: true,
    UImessage: `Store status updated to ${status}.`,
    store: updatedStore,
  });
});

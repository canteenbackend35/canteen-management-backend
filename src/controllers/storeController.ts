import { Request, Response } from "express";
import prisma from "../config/prisma_client.js";
import * as StoreService from "../services/storeService.js";

/**
 * @desc    List all stores
 * @route   GET /stores
 * @access  Public
 */
export const listStores = async (req: Request, res: Response) => {
  try {
    const stores = await prisma.store.findMany();
    res.json(stores);
  } catch (err) {
    console.error("🔥 listStores Error:", err);
    res.status(500).json({ error: "Failed to fetch stores", details: err });
  }
};

/**
 * @desc    Get Store Menu
 * @route   GET /stores/:storeId/menu
 * @access  Public
 */
export const getStoreMenu = async (req: Request, res: Response) => {
  try {
    const { storeId: storeIdParam } = req.params;
    const storeId = parseInt(storeIdParam!, 10);

    if (isNaN(storeId)) {
      return res.status(400).json({ success: false, UImessage: "Invalid Store ID provided." });
    }

    const menu = await prisma.menuItem.findMany({
      where: { store_id: storeId },
    });
    res.json(menu);
  } catch (err: any) {
    console.error("🔥 getStoreMenu Error:", err);
    res.status(500).json({ error: "Failed to fetch menu", details: err });
  }
};

/**
 * @desc    Get Store Orders
 * @route   GET /stores/orders
 * @access  Private (Store only)
 */
export const getStoreOrders = async (req: Request, res: Response) => {
  try {
    const storeId = req.store_id;

    if (!storeId) {
      return res.status(401).json({ success: false, UImessage: "Unauthorized." });
    }

    const orders = await StoreService.getStoreOrdersWithDetails(storeId);

    return res.json({
      success: true,
      UImessage: orders.length > 0 ? `Successfully fetched ${orders.length} orders.` : "No orders found.",
      orders
    });
  } catch (err) {
    console.error("🔥 getStoreOrders Error:", err);
    return res.status(500).json({ success: false, UImessage: "Failed to fetch orders." });
  }
};

import { Request, Response } from "express";
import prisma from "../config/prisma_client.js";

// List all stores
export const listStores = async (req: Request, res: Response) => {
  try {
    const stores = await prisma.store.findMany();
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stores", details: err });
  }
};

// Get all orders of a store
export const getStoreMenu = async (req: Request, res: Response) => {
  try {
    const storeId = parseInt(req.params.storeId!, 10);

    const menu = await prisma.menuItem.findMany({
      where: { store_id: storeId },
    });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu", details: err });
  }
};

export const getStoreOrders = async (req: Request, res: Response) => {
  try {
    const storeId = parseInt(req.params.storeId!, 10);

    const menu = await prisma.order.findMany({
      where: { store_id: storeId },
    });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu", details: err });
  }
};

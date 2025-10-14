import { Request, Response } from "express";
import prisma from "../config/prisma_client.js";

// Add menu item to store
export const addMenuItem = async (req: Request, res: Response) => {
  try {
    const storeId = parseInt(req.params.storeId!, 10);
    const { name, price } = req.body;
    console.log(name);
    console.log(price);

    const item = await prisma.menuItem.create({
      data: { store_id: storeId, name, price },
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to add menu item", details: err });
  }
};

// Update menu item
export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId!, 10);
    const { name, price, status } = req.body;
    const item = await prisma.menuItem.update({
      where: { menu_item_id: itemId },
      data: { name, price, status },
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to update menu item", details: err });
  }
};

// Delete menu item
export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId!, 10);
    await prisma.menuItem.delete({ where: { menu_item_id: itemId } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete menu item", details: err });
  }
};

import { Request, Response } from "express";
import prisma from "../config/prisma_client.js";

/**
 * @desc    Add menu item to the authenticated store
 * @route   POST /menu
 * @access  Private (Store only)
 */
export const addMenuItem = async (req: Request, res: Response) => {
  try {
    const storeId = req.store_id; // From auth middleware
    const { name, price } = req.body;

    if (!storeId) {
      return res.status(401).json({ success: false, UImessage: "Unauthorized. Store ID missing." });
    }

    if (!name || !price) {
      return res.status(400).json({ success: false, UImessage: "Name and price are required." });
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
  } catch (err: any) {
    console.error("🔥 addMenuItem Error:", err.message);
    return res.status(500).json({ success: false, UImessage: "Failed to add menu item." });
  }
};

/**
 * @desc    Update a menu item belonging to the authenticated store
 * @route   PUT /menu/:itemId
 * @access  Private (Store only)
 */
export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const storeId = req.store_id;
    const itemId = parseInt(req.params.itemId!, 10);
    const { name, price, status } = req.body;

    if (!storeId) {
      return res.status(401).json({ success: false, UImessage: "Unauthorized." });
    }

    // Security Check: Ensure item belongs to this store
    const existingItem = await prisma.menuItem.findUnique({ where: { menu_item_id: itemId } });
    if (!existingItem || existingItem.store_id !== storeId) {
      return res.status(403).json({ success: false, UImessage: "Access denied. This item does not belong to your store." });
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
  } catch (err: any) {
    console.error("🔥 updateMenuItem Error:", err.message);
    return res.status(500).json({ success: false, UImessage: "Failed to update menu item." });
  }
};

/**
 * @desc    Delete a menu item belonging to the authenticated store
 * @route   DELETE /menu/:itemId
 * @access  Private (Store only)
 */
export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const storeId = req.store_id;
    const itemId = parseInt(req.params.itemId!, 10);

    if (!storeId) {
      return res.status(401).json({ success: false, UImessage: "Unauthorized." });
    }

    // Security Check: Ensure item belongs to this store
    const existingItem = await prisma.menuItem.findUnique({ where: { menu_item_id: itemId } });
    if (!existingItem || existingItem.store_id !== storeId) {
      return res.status(403).json({ success: false, UImessage: "Access denied." });
    }

    await prisma.menuItem.delete({ where: { menu_item_id: itemId } });
    
    return res.status(200).json({
      success: true,
      UImessage: "Menu item deleted successfully."
    });
  } catch (err: any) {
    console.error("🔥 deleteMenuItem Error:", err.message);
    return res.status(500).json({ success: false, UImessage: "Failed to delete menu item." });
  }
};

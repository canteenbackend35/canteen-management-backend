import express from "express";
import {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Middleware to check if user is a store
const isStore = (req: any, res: any, next: any) => {
  if (req.role !== 'store') {
    return res.status(403).json({ success: false, UImessage: "Access denied. Only stores can manage menu items." });
  }
  next();
};

// --- PRIVATE ROUTES (Store Only) ---
router.post("/", auth, isStore, addMenuItem);
router.put("/:itemId", auth, isStore, updateMenuItem);
router.delete("/:itemId", auth, isStore, deleteMenuItem);

export default router;

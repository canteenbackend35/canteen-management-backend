import express from "express";
import {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";
import { auth } from "../middleware/auth.js";
import { isStore } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { addMenuItemSchema, updateMenuItemSchema, menuItemIdSchema } from "../validators/menuValidator.js";

const router = express.Router();

// --- PRIVATE ROUTES (Store Only) ---
router.post("/", auth, isStore, validate(addMenuItemSchema), addMenuItem);
router.put("/:itemId", auth, isStore, validate(updateMenuItemSchema), updateMenuItem);
router.delete("/:itemId", auth, isStore, validate(menuItemIdSchema), deleteMenuItem);

export default router;

import express from "express";
import { listStores, getStoreMenu, getStoreOrders, updateStoreStatus } from "../controllers/storeController.js";
import { auth } from "../middleware/auth.js";
import { isStore } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { storeIdSchema, updateStoreStatusSchema } from "../validators/storeValidator.js";

const router = express.Router();

// --- PUBLIC ROUTES ---
router.get("/", listStores);
router.get("/:storeId/menu", validate(storeIdSchema), getStoreMenu);

// --- PRIVATE ROUTES ---
router.get("/orders", auth, isStore, getStoreOrders);
router.patch("/status", auth, isStore, validate(updateStoreStatusSchema), updateStoreStatus);

export default router;

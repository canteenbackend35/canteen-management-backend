import express from "express";
import { listStores, getStoreMenu, getStoreOrders } from "../controllers/storeController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// --- PUBLIC ROUTES ---
router.get("/", listStores);
router.get("/:storeId/menu", getStoreMenu);

// --- PRIVATE ROUTES ---
router.get("/orders", auth, getStoreOrders);

export default router;

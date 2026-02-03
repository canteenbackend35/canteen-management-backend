import express from "express";
import { listStores, getStoreMenu, getStoreOrders } from "../controllers/storeController.js";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validateMiddleware.js";
import { storeIdSchema } from "../validators/storeValidator.js";

const router = express.Router();

// --- PUBLIC ROUTES ---
router.get("/", listStores);
router.get("/:storeId/menu", validate(storeIdSchema), getStoreMenu);

// --- PRIVATE ROUTES ---
router.get("/orders", auth, getStoreOrders);

export default router;

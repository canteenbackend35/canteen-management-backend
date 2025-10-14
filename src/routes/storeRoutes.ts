import express from "express";
import {
  listStores,
  getStoreOrders,
  getStoreMenu,
} from "../controllers/storeController.js";

const router = express.Router();

// router.post("/signup", signupStore);
// router.post("/login", loginStore);
router.get("/", listStores);
router.get("/:storeId/orders", getStoreOrders);
router.get("/:storeId/menu", getStoreMenu);

export default router;

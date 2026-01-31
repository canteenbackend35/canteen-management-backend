import express from "express";
import {
  listStores,
  getStoreOrders,
  getStoreMenu,
  loginStore,
  signUpStore,
  sendStoreOtp,
  verifyStoreOtp,
  refreshStoreToken,
  getStoreProfile
} from "../controllers/storeController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// --- PUBLIC ROUTES ---
router.get("/", listStores);
router.get("/:storeId/menu", getStoreMenu);
router.post("/login", loginStore);
router.post("/signup", signUpStore);
router.post("/send-otp", sendStoreOtp);
router.post("/verify-otp", verifyStoreOtp);
router.post("/refresh", refreshStoreToken);

// --- PRIVATE ROUTES ---
router.get("/profile", auth, getStoreProfile);
router.get("/:storeId/orders", auth, getStoreOrders);

export default router;

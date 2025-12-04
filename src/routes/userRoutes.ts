import express from "express";
import {
  getUserOrders,
  loginUser,
  signUpUser,
} from "../controllers/userController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/signup", signUpUser);
router.get("/orders", auth, getUserOrders);

export default router;

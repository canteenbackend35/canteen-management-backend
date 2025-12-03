import express from "express";
import { getUserOrders, loginUser } from "../controllers/userController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", loginUser);
// router.get("/signup", signUpUser);
router.get("/orders", auth, getUserOrders);

export default router;

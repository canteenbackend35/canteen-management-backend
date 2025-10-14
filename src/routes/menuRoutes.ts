import express from "express";
import {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";

const router = express.Router();

router.post("/:storeId", addMenuItem);
router.put("/:itemId", updateMenuItem);
router.delete("/:itemId", deleteMenuItem);

export default router;

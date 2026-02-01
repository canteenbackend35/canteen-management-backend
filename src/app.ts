import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import { requestLogger } from "./middleware/requestLogger.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8081",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// 🔥 Add this before all routes
app.use(requestLogger);

app.use("/api/users", userRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

export default app;

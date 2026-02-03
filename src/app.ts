import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import morgan from "morgan";
import logger from "./utils/logger.js";

const app = express();

// Use Morgan for HTTP request logging, streaming to Winston
app.use(
  morgan(":method :url :status :response-time ms", {
    stream: {
      write: msg => logger.info(msg.trim())
    }
  })
);


app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

// --- GLOBAL ERROR HANDLER ---
// 🔥 This MUST be the last middleware
import { errorMiddleware } from "./middleware/errorMiddleware.js";
app.use(errorMiddleware);

export default app;

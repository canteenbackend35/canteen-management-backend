import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/stores", storeRoutes);
app.use("/item", menuRoutes);
app.use("/orders", orderRoutes);

export default app;

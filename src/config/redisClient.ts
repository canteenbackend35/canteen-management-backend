import { createClient } from "redis";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const options: any = {
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
};

if (process.env.REDIS_PASSWORD) {
  options.password = process.env.REDIS_PASSWORD;
}

const redisClient = createClient(options);

redisClient.on("connect", () => logger.info("✅ Redis connected"));
redisClient.on("error", (err) => logger.error("❌ Redis error: %o", err));

await redisClient.connect();

export default redisClient;

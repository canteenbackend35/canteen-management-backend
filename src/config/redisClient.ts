import { createClient } from "redis";
import dotenv from "dotenv";

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

redisClient.on("connect", () => console.log("✅ Redis connected"));
redisClient.on("error", (err) => console.error("❌ Redis error", err));

(async () => {
  await redisClient.connect();
})();

export default redisClient;

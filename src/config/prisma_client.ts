import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger.js";

const prisma = new PrismaClient();

// Verify connection on startup
prisma.$connect()
  .then(() => logger.info("✅ Supabase Database connected via Prisma"))
  .catch((err: any) => {
    logger.error("❌ Supabase connection failed!", { message: err.message });
    logger.info("💡 Tip: Check if your Supabase project is PAUSED or if the DATABASE_URL is correct.");
  });

export default prisma;

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Verify connection on startup
(async () => {
  try {
    await prisma.$connect();
    console.log("✅ Supabase Database connected via Prisma");
  } catch (err: any) {
    console.error("❌ Supabase connection failed!");
    console.error("Reason:", err.message);
    console.log("💡 Tip: Check if your Supabase project is PAUSED or if the DATABASE_URL is correct.");
  }
})();

export default prisma;

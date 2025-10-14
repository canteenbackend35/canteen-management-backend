-- CreateEnum
CREATE TYPE "ItemStaus" AS ENUM ('AVAILABLE', 'OUT_OF_STOCK');

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "status" "ItemStaus" NOT NULL DEFAULT 'AVAILABLE';

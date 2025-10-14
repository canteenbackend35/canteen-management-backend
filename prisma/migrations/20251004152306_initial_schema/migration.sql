-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Customer" (
    "customer_id" SERIAL NOT NULL,
    "phone_no" TEXT NOT NULL,
    "course" TEXT,
    "college" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "Store" (
    "store_id" SERIAL NOT NULL,
    "store_name" TEXT NOT NULL,
    "phone_no" TEXT NOT NULL,
    "status" "StoreStatus" NOT NULL DEFAULT 'OPEN',
    "payment_details" TEXT,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("store_id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "menu_item_id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("menu_item_id")
);

-- CreateTable
CREATE TABLE "Order" (
    "order_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "payment_id" TEXT,
    "order_otp" TEXT NOT NULL,
    "order_status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "order_id" INTEGER NOT NULL,
    "menu_item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("order_id","menu_item_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_no_key" ON "Customer"("phone_no");

-- CreateIndex
CREATE UNIQUE INDEX "Store_phone_no_key" ON "Store"("phone_no");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem"("menu_item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

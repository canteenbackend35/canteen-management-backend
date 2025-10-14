import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.store.deleteMany();
  await prisma.customer.deleteMany();
  // --- Customers ---
  const ayush = await prisma.customer.create({
    data: {
      name: "Ayush Kumar",
      course: "Btech ECE",
      phone_no: "9555305250",
      college: "Bharati Vidyapeeth College of Engineering",
    },
  });

  const vishal = await prisma.customer.create({
    data: {
      name: "Vishal Bhalla",
      course: "Btech ECE",
      phone_no: "7428863565",
      college: "Bharati Vidyapeeth College of Engineering",
    },
  });

  // --- Stores ---
  const sharan = await prisma.store.create({
    data: {
      store_name: "Sharan-Di-Hatti",
      status: "OPEN",
      payment_details: "UPI: sharan@UPI",
      phone_no: "7558781427",
    },
  });

  const bawarchi = await prisma.store.create({
    data: {
      store_name: "Bawarchi Caterers",
      status: "OPEN",
      payment_details: "UPI: bawarchi@UPI",
      phone_no: "7982404341",
    },
  });

  // --- Menu Items ---
  const rajma = await prisma.menuItem.create({
    data: { store_id: sharan.store_id, name: "Rajma Chawal", price: 60 },
  });

  const vegThali = await prisma.menuItem.create({
    data: { store_id: sharan.store_id, name: "Veg Thali", price: 60 },
  });

  const dosa = await prisma.menuItem.create({
    data: { store_id: bawarchi.store_id, name: "Dosa", price: 60 },
  });

  const idli = await prisma.menuItem.create({
    data: { store_id: bawarchi.store_id, name: "Idli", price: 60 },
  });

  // --- Orders ---
  const order1 = await prisma.order.create({
    data: {
      customer_id: vishal.customer_id,
      store_id: sharan.store_id,
      total_price: 120,
      payment_id: "bhalla@upi",
      order_otp: "8765",
      order_status: "CONFIRMED",
      order_date: new Date(),
    },
  });

  const order2 = await prisma.order.create({
    data: {
      customer_id: ayush.customer_id,
      store_id: sharan.store_id,
      total_price: 120,
      payment_id: "ayush@upi",
      order_otp: "8237",
      order_status: "CONFIRMED",
      order_date: new Date(),
    },
  });

  // --- Order Items ---
  await prisma.orderItem.createMany({
    data: [
      {
        order_id: order1.order_id,
        menu_item_id: rajma.menu_item_id,
        quantity: 1,
      },
      {
        order_id: order1.order_id,
        menu_item_id: vegThali.menu_item_id,
        quantity: 1,
      },
      {
        order_id: order2.order_id,
        menu_item_id: dosa.menu_item_id,
        quantity: 1,
      },
      {
        order_id: order2.order_id,
        menu_item_id: idli.menu_item_id,
        quantity: 1,
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding started...");

  // ---------------- CUSTOMERS ----------------
  await prisma.customer.createMany({
    data: [
      {
        phone_no: "9000000001",
        email: "vishalbhalla1203@mail.com",
        name: "Aarav",
        course: "B.Tech",
        college: "IIT Delhi",
      },
      {
        phone_no: "9000000002",
        email: "vishalbhalla200@mail.com",
        name: "Riya",
        course: "BBA",
        college: "DU",
      },
      {
        phone_no: "9000000003",
        email: "vishalbhalla722@mail.com",
        name: "Kabir",
        course: "MBA",
        college: "IIM",
      },
      {
        phone_no: "9000000004",
        email: "c4@mail.com",
        name: "Sanya",
        course: "BA",
        college: "IPU",
      },
      {
        phone_no: "9000000005",
        email: "c5@mail.com",
        name: "Ishaan",
        course: "BCA",
        college: "Amity",
      },
      {
        phone_no: "9000000006",
        email: "c6@mail.com",
        name: "Zara",
        course: "B.Com",
        college: "SRCC",
      },
    ],
  });

  const customerList = await prisma.customer.findMany();

  // ---------------- STORES ----------------
  await prisma.store.createMany({
    data: [
      { store_name: "Pizza Hub", phone_no: "7000000001", status: "OPEN" },
      { store_name: "Burger Town", phone_no: "7000000002", status: "OPEN" },
      { store_name: "Chai & Snacks", phone_no: "7000000003", status: "OPEN" },
      {
        store_name: "South Indian Delight",
        phone_no: "7000000004",
        status: "OPEN",
      },
      { store_name: "Healthy Salads", phone_no: "7000000005", status: "OPEN" },
    ],
  });

  const storeList = await prisma.store.findMany();

  // ---------------- MENU ITEMS ----------------
  const storeMenus: { [key: string]: { name: string; price: number }[] } = {
    "Pizza Hub": [
      { name: "Margherita Pizza", price: 299 },
      { name: "Pepperoni Pizza", price: 399 },
      { name: "Garlic Breadsticks", price: 129 },
      { name: "Farmhouse Pizza", price: 349 },
    ],
    "Burger Town": [
      { name: "Classic Veg Burger", price: 99 },
      { name: "Cheese Lava Burger", price: 159 },
      { name: "French Fries", price: 79 },
      { name: "Crispy Chicken Burger", price: 189 },
    ],
    "Chai & Snacks": [
      { name: "Masala Chai", price: 25 },
      { name: "Samosa (2pcs)", price: 40 },
      { name: "Bread Pakoda", price: 30 },
      { name: "Cold Coffee", price: 80 },
    ],
    "South Indian Delight": [
      { name: "Masala Dosa", price: 120 },
      { name: "Idli Sambhar (2pcs)", price: 60 },
      { name: "Vada (2pcs)", price: 70 },
      { name: "Onion Uttapam", price: 140 },
    ],
    "Healthy Salads": [
      { name: "Caesar Salad", price: 210 },
      { name: "Greek Salad", price: 190 },
      { name: "Fruit Bowl", price: 150 },
      { name: "Quinoa Bowl", price: 240 },
    ],
  };

  const menuItemsData: Prisma.MenuItemCreateManyInput[] = [];

  for (const store of storeList) {
    const items = storeMenus[store.store_name] || [
      { name: "Standard Meal", price: 150 },
      { name: "Soft Drink", price: 40 },
    ];

    for (const item of items) {
      menuItemsData.push({
        store_id: store.store_id,
        name: item.name,
        price: item.price,
        status: "AVAILABLE",
      });
    }
  }

  await prisma.menuItem.createMany({ data: menuItemsData });

  const allMenuItems = await prisma.menuItem.findMany();

  // ---------------- HELPERS ----------------
  function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomItemsForOrder(menuItems: typeof allMenuItems) {
    const shuffled = [...menuItems].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.floor(Math.random() * 3) + 1);

    return selected.map((item) => ({
      menu_item_id: item.menu_item_id,
      quantity: Math.floor(Math.random() * 3) + 1,
    }));
  }

  // ---------------- ORDERS ----------------
  for (let i = 0; i < 10; i++) {
    const randomCustomer = randomItem(customerList);
    const randomStore = randomItem(storeList);

    const storeMenuItems = allMenuItems.filter(
      (m) => m.store_id === randomStore.store_id
    );

    const items = randomItemsForOrder(storeMenuItems);

    const totalPrice = items.reduce((sum, it) => {
      const price =
        storeMenuItems.find((m) => m.menu_item_id === it.menu_item_id)?.price ||
        0;
      return sum + price * it.quantity;
    }, 0);

    await prisma.order.create({
      data: {
        customer_id: randomCustomer.customer_id,
        store_id: randomStore.store_id,
        total_price: totalPrice,
        payment_id: "PAY-" + (10000 + i),
        order_otp: (1000 + i).toString(),
        order_status: "PENDING",
        items: { create: items },
      },
    });
  }

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

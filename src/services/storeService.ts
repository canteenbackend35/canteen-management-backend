import prisma from "../config/prisma_client.js";
import redisClient from "../config/redisClient.js";
import { Global } from "../config/global.js";

/**
 * Finds a store by phone number.
 */
export const findStoreByPhone = async (phoneNo: string) => {
  return prisma.store.findUnique({ where: { phone_no: phoneNo } });
};

/**
 * Finds a store by their ID.
 */
export const findStoreById = async (storeId: number) => {
  return prisma.store.findUnique({ where: { store_id: storeId } });
};

/**
 * Stores temporary signup data for a store in Redis.
 */
export const storeTempStoreData = async (phoneNo: string, data: any) => {
  const redisKey = `signup:temp:store:${phoneNo}`;
  await redisClient.set(redisKey, JSON.stringify(data), { EX: 600 }); // 10 mins
};

/**
 * Retrieves and deletes temporary store signup data from Redis, then creates a new store.
 */
export const completeStoreSignupFromTempData = async (phoneNo: string) => {
  const redisKey = `signup:temp:store:${phoneNo}`;
  const tempStoreDataStr = await redisClient.get(redisKey);

  if (!tempStoreDataStr) return null;

  const tempStore = JSON.parse(tempStoreDataStr.toString());

  const newStore = await prisma.store.create({
    data: {
      phone_no: tempStore.phone_no,
      store_name: tempStore.store_name,
    }
  });

  await redisClient.del(redisKey);
  return newStore;
};

/**
 * Fetches orders for a specific store with nested items and customer info.
 */
export const getStoreOrdersWithDetails = async (storeId: number) => {
  return prisma.order.findMany({
    where: { store_id: storeId },
    include: {
      items: { include: { menu_item: true } },
      customer: true,
    },
    orderBy: { order_date: 'desc' }
  });
};

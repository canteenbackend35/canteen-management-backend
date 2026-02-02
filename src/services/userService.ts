import prisma from "../config/prisma_client.js";
import redisClient from "../config/redisClient.js";
import { Global } from "../config/global.js";

/**
 * Finds a customer by phone number.
 */
export const findCustomerByPhone = async (phoneNo: string) => {
  return prisma.customer.findUnique({ where: { phone_no: phoneNo } });
};

/**
 * Finds a customer by their ID.
 */
export const findCustomerById = async (customerId: number) => {
  return prisma.customer.findUnique({ where: { customer_id: customerId } });
};

/**
 * Stores temporary signup data in Redis.
 */
export const storeTempSignupData = async (phoneNo: string, data: any) => {
  const redisKey = `signup:temp:${phoneNo}`;
  await redisClient.set(redisKey, JSON.stringify(data), { EX: Global.signupFormExpireTimeRedis });
};

/**
 * Retrieves and deletes temporary signup data from Redis, then creates a new customer.
 */
export const completeSignupFromTempData = async (phoneNo: string) => {
  const redisKey = `signup:temp:${phoneNo}`;
  const tempUserDataStr = await redisClient.get(redisKey);

  if (!tempUserDataStr) return null;

  const tempUser = JSON.parse(tempUserDataStr.toString());

  const newUser = await prisma.customer.create({
    data: {
      phone_no: tempUser.phone_no,
      email: tempUser.email,
      name: tempUser.name,
      course: tempUser.course || null,
      college: tempUser.college || null,
    }
  });

  await redisClient.del(redisKey);
  return newUser;
};

/**
 * Fetches orders for a specific customer with nested items and store info.
 */
export const getCustomerOrdersWithDetails = async (customerId: number) => {
  return prisma.order.findMany({
    where: { customer_id: customerId },
    include: {
      items: {
        include: {
          menu_item: {
            select: {
              name: true,
              price: true,
              status: true
            }
          }
        }
      },
      store: {
        select: {
          store_name: true,
          phone_no: true
        }
      },
    },
    orderBy: { order_date: 'desc' }
  });
};

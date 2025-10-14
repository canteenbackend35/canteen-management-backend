import redisClient from "../config/redisClient.js";

export async function storeOTP(phone: string, otp: string) {
  const key = `otp:${phone}`; // Key: phone number
  const ttl = 300; // Expire in 300 seconds (5 min)
  await redisClient.setEx(key, ttl, otp); // store OTP
  console.log(`OTP for ${phone} stored in Redis`);
}

export async function getOTP(phone: string) {
  const key = `otp:${phone}`;
  const otp = await redisClient.get(key);
  return otp; // null if not found or expired
}

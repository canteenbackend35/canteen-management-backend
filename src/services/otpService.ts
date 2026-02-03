import redisClient from "../config/redisClient.js";
import OTPWidget from "../config/msg91_client.js";
import { Global } from "../config/global.js";
import logger from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Generates a random numeric OTP of specified length.
 */
export const generateNumericOtp = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Handles rate limiting and sending OTP.
 */
export const triggerAuthOtpSend = async (phoneNo: string) => {
  // 1. Validation
  if (!phoneNo || !/^[0-9]{10}$/.test(phoneNo)) {
    throw new ApiError(400, "Invalid phone number. Please provide a 10-digit number.");
  }

  if (process.env.NODE_ENV === "development") {
    return {
      success: true,
      status: 200,
      message: "OTP sent successfully",
      reqId: "1234567890",
    };
  }

  // 2. Rate Limiting (Using Redis)
  const limitKey = `otp:limit:${phoneNo}`;
  const attemptCountStr = await redisClient.get(limitKey);
  const attemptCount: number = attemptCountStr ? parseInt(attemptCountStr.toString(), 10) : 0;

  if (attemptCount >= 3) { 
    const ttlSeconds = await redisClient.ttl(limitKey);
    const retryAtText = (ttlSeconds as number) > 0 
      ? `again after ${new Date(Date.now() + (ttlSeconds as number) * 1000).toLocaleTimeString()}`
      : "again soon";
    
    throw new ApiError(429, `Max attempts reached. Please try ${retryAtText}.`);
  }

  // 3. Send OTP via MSG91
  const fullPhoneNo = phoneNo.startsWith("91") ? phoneNo : `91${phoneNo}`;
  const response: any = await OTPWidget.sendOTP({ identifier: fullPhoneNo });

  if (response.type === "error") {
    throw new ApiError(400, response.message || "Failed to send OTP.");
  }

  // 4. Update Rate Limit Counter
  if (attemptCount === 0) {
    await redisClient.set(limitKey, "1", { EX: Global.otpRateLimitExpireRedis });
  } else {
    await redisClient.incr(limitKey);
  }

  return {
    success: true,
    status: 200,
    message: "OTP sent successfully",
    reqId: response.message,
  };
};

/**
 * Verifies the OTP provided by the user.
 */
export const verifyAuthOtp = async (otp: string, reqId: string, phoneNo: string) => {
  if (process.env.NODE_ENV === "development") {
    return { success: true, status: 200, message: "OTP verified successfully." };
  }

  // 1. Verify OTP with Provider
  const verifyResponse: any = await OTPWidget.verifyOTP({ otp, reqId });

  if (verifyResponse.type === "error") {
    throw new ApiError(400, verifyResponse.message || "OTP verification failed.");
  }

  // 2. Clear Rate Limits on Success
  await redisClient.del(`otp:limit:${phoneNo}`);

  return { success: true, status: 200, message: "OTP verified successfully." };
};

import redisClient from "../config/redisClient.js";
import OTPWidget from "../config/msg91_client.js";

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
 * Handles rate limiting and sending OTP via MSG91 for authentication.
 */
export const triggerAuthOtpSend = async (phoneNo: string) => {
  try {
    // 1. Validation
    if (!phoneNo || !/^[0-9]{10}$/.test(phoneNo)) {
      return { 
        success: false, 
        status: 400, 
        message: "Invalid phone number. Please provide a 10-digit number." 
      };
    }

    // 2. Rate Limiting (Using Redis)
    const redisKey = `otp:limit:${phoneNo}`;
    const attemptCountStr = await redisClient.get(redisKey);
    const attemptCount: number = attemptCountStr ? parseInt(attemptCountStr.toString(), 10) : 0;

    if (attemptCount >= 3) { 
      const ttlSeconds = await redisClient.ttl(redisKey);
      const retryAtText = (ttlSeconds as number) > 0 
        ? `again after ${new Date(Date.now() + (ttlSeconds as number) * 1000).toLocaleTimeString()}`
        : "again soon";
      
      return {
        success: false,
        status: 429,
        message: `Max attempts reached. Please try ${retryAtText}.`,
      };
    }

    // 3. Send OTP via MSG91
    const fullPhoneNo = phoneNo.startsWith("91") ? phoneNo : `91${phoneNo}`;
    const response: any = await OTPWidget.sendOTP({ identifier: fullPhoneNo });

    if (response.type === "error") {
      return {
        success: false,
        status: 400,
        message: response.message || "Failed to send OTP.",
      };
    }

    // 4. Update Rate Limit Counter
    if (attemptCount === 0) {
      await redisClient.set(redisKey, "1", { EX: 60 * 30 }); // 30 mins window
    } else {
      await redisClient.incr(redisKey);
    }

    return {
      success: true,
      status: 200,
      message: "OTP sent successfully",
      reqId: response.message,
    };
  } catch (error: any) {
    console.error("🔥 triggerAuthOtpSend Error:", error.message);
    return { success: false, status: 500, message: "Server error while sending OTP" };
  }
};

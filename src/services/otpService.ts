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
 * Handles rate limiting and sending OTP (logged to console for development).
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

    // 2. Rate Limiting (Using Redis) - Same as before
    const limitKey = `otp:limit:${phoneNo}`;
    const attemptCountStr = await redisClient.get(limitKey);
    const attemptCount: number = attemptCountStr ? parseInt(attemptCountStr.toString(), 10) : 0;

    if (attemptCount >= 3) { 
      const ttlSeconds = await redisClient.ttl(limitKey);
      const retryAtText = (ttlSeconds as number) > 0 
        ? `again after ${new Date(Date.now() + (ttlSeconds as number) * 1000).toLocaleTimeString()}`
        : "again soon";
      
      return {
        success: false,
        status: 429,
        message: `Max attempts reached. Please try ${retryAtText}.`,
      };
    }

    // 3. DEVELOPMENT MOCK: Generate OTP and reqId locally
    const otp = generateNumericOtp(6);
    const reqId = `dev_${Math.random().toString(36).substring(2, 15)}`; 

    // Store for verification in Redis
    const verifyKey = `otp:verify:${reqId}`;
    await redisClient.set(verifyKey, JSON.stringify({ phoneNo, otp }), { EX: 600 }); // 10 mins

    console.log("-----------------------------------------");
    console.log("🛠️  DEVELOPMENT OTP LOG (MSG91 BYPASSED)");
    console.log(`📱 Phone: ${phoneNo}`);
    console.log(`🔑 OTP: ${otp}`);
    console.log(`🆔 reqId: ${reqId}`);
    console.log("-----------------------------------------");

    /* 
    // Commented out MSG91 service for development cost saving
    const fullPhoneNo = phoneNo.startsWith("91") ? phoneNo : `91${phoneNo}`;
    const response: any = await OTPWidget.sendOTP({ identifier: fullPhoneNo });

    if (response.type === "error") {
      return {
        success: false,
        status: 400,
        message: response.message || "Failed to send OTP.",
      };
    }
    */

    // 4. Update Rate Limit Counter
    if (attemptCount === 0) {
      await redisClient.set(limitKey, "1", { EX: 60 * 30 }); // 30 mins window
    } else {
      await redisClient.incr(limitKey);
    }

    return {
      success: true,
      status: 200,
      message: "OTP sent successfully (Check console in dev)",
      reqId: reqId, // Returning our local reqId
    };
  } catch (error: any) {
    console.error("🔥 triggerAuthOtpSend Error:", error.message);
    return { success: false, status: 500, message: "Server error while sending OTP" };
  }
};

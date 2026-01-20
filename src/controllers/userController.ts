import { Request, Response } from "express";
import prisma from "../config/prisma_client.js";
import redisClient from "../config/redisClient.js";
import OTPWidget from "../config/msg91_client.js";

//send otp endpoint controller - to be completed by ayush

//will generate and send the otp via SMS
//will store the OTP and the corresponding phone number in the redis for checking later and set its expiry to 2 mins
//send message to the frontend {phoneNo:"XXXXX-XXXXX", message: "OTP successfully sent!"}

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { phoneNo } = req.body;
    console.log("📥 Incoming sendOtp request for:", phoneNo);

    // 1. Validate phone number
    if (!phoneNo || !/^[0-9]{10}$/.test(phoneNo)) {
      console.log("❌ Invalid phone number");
      return res
        .status(400)
        .json({ success: false, UImessage: "Invalid phone number" });
    }

    const redisKey = `otp:attempts:${phoneNo}`;

    // 2. Check current attempt count
    const attemptCountStr = await redisClient.get(redisKey);
    const attemptCount = attemptCountStr ? Number(attemptCountStr) : 0;

    console.log(`🔢 Current OTP attempts for ${phoneNo}:`, attemptCount);

    // 3. If attempts exceeded
    if (attemptCount >= 3) {
      const ttlSeconds = await redisClient.ttl(redisKey);

      console.log(`⏳ TTL remaining (seconds):`, ttlSeconds);

      const retryAt = new Date(Date.now() + ttlSeconds * 1000);

      console.log(`🚫 OTP blocked until:`, retryAt);

      return res.status(429).json({
        success: false,
        UImessage: `You have used up all of your three attempts to receive OTP. Try again after ${retryAt.toLocaleString()}.`,
      });
    }

    // 4. Increment attempt count
    const newAttemptCount = attemptCount + 1;

    if (attemptCount === 0) {
      // First attempt → set value with 24h expiry
      await redisClient.set(redisKey, String(newAttemptCount), {
        EX: 60 * 60 * 24,
      });
      console.log("🧠 First OTP attempt stored, TTL set to 24 hours");
    } else {
      // Subsequent attempts → just increment
      await redisClient.incr(redisKey);
      console.log("🧠 OTP attempt incremented");
    }

    // 5. Send OTP using MSG91
    console.log("📤 Sending OTP via MSG91...");
    const sendOtpResponse:any = await OTPWidget.sendOTP({
      identifier: phoneNo,
    });

    console.log("📨 MSG91 response:", sendOtpResponse);

    if (sendOtpResponse.type === "error") {
      console.log("❌ MSG91 failed to send OTP");
      return res.status(400).json({
        success: false,
        UImessage: sendOtpResponse.message,
      });
    }

    console.log("✅ OTP sent successfully");

    return res.status(200).json({
      success: true,
      UImessage: "OTP sent successfully",
      reqId: sendOtpResponse.message, // useful for verify API
      phoneNo,
    });
  } catch (error) {
    console.error("🔥 sendOtp failed:", error);
    return res.status(500).json({
      success: false,
      UImessage: "Server error while sending OTP",
    });
  }
};


//validate-otp and identify new or old user endpoint controller - to be completed by vishal

//this endpoint will take the user otp and phone number from the frontend and check wether the otp matches in the redis!(the above endpoint will store the otp and phone no in the redis)
//if his number cannot be found in the redis db then he the otp has expired and send the appropriate response to the frontend: {phoneNo:"XXXXX-XXXXX", message: "You took too long! OTP expired"}
//if his otp does not match then also send an appropriate response to the frontend: {phoneNo:"XXXXX-XXXXX", message: "OTP does not match!"}
//if it matches then it will check wether the user already exists in the db
//if new user it will send the message to the frontend that it is a new user with his phoneNo verified and redirect him to signup/form-data page: {phoneNo:"XXXXX-XXXXX", message: "OTP matched successfully!!", user_type: "new user"}
//if old user then backend will generate his jwt tokens (access + refresh) and send it to the frontend so that the frontend can then redirect him to his dashboard: {phoneNo:"XXXXX-XXXXX", message: "OTP matched successfully!!", user_type: "old user", tokens:{access: "xxxxxxxxxxxxxxx", refresh: "xxxxxxxxxxxxxxxxxx"}}
//remember to handle checkpoints!

//handle new-user data endpoint controller - to be assigned yet!

//will get all the user details along with the phone number we send in the above endpoint!
//and store it in supabase database
//and send his tokens along with a success message!

// Get Orders of User
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const email = req.email;

    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const orders = await prisma.order.findMany({
      where: { customer_id: customer.customer_id },
      include: {
        items: {
          include: {
            menu_item: true,
          },
        },
        store: true,
      },
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders", details: err });
  }
};

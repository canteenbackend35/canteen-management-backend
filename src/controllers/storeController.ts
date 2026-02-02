import { Request, Response } from "express";
import prisma from "../config/prisma_client.js";
import redisClient from "../config/redisClient.js";
import { triggerAuthOtpSend } from "../services/otpService.js";
import { generateAccessToken, generateRefreshToken } from "../services/jwtService.js";
import OTPWidget from "../config/msg91_client.js";

/**
 * @desc    STEP 1: Send OTP for Store (Generic)
 * @route   POST /stores/send-otp
 * @access  Public
 */
export const sendStoreOtp = async (req: Request, res: Response) => {
  const { phoneNo } = req.body;
  console.log("📥 Store OTP Request for:", phoneNo);
  
  const result = await triggerAuthOtpSend(phoneNo);
  return res.status(result.status).json({
    success: result.success,
    UImessage: result.message,
    reqId: result.reqId,
    phoneNo,
  });
};

/**
 * @desc    STEP 2: Verify Store OTP and Login/Signup
 * @route   POST /stores/verify-otp
 * @access  Public
 */
export const verifyStoreOtp = async (req: Request, res: Response) => {
  try {
    const { phoneNo, otp, reqId } = req.body;

    if (!phoneNo || !otp || !reqId) {
      return res.status(400).json({ success: false, UImessage: "Missing required fields." });
    }

    // 1. Verify OTP with Provider
    const verifyResponse: any = await OTPWidget.verifyOTP({ otp, reqId });

    if (verifyResponse.type === "error") {
      return res.status(400).json({ success: false, UImessage: verifyResponse.message || "Invalid or expired OTP." });
    }

    // 2. Clear Rate Limit on success
    await redisClient.del(`otp:limit:${phoneNo}`);

    // 3. Identification (Login or New Store)
    const store = await prisma.store.findUnique({ where: { phone_no: phoneNo } });

    if (store) {
      const payload = {
        role: 'store' as const,
        store_id: store.store_id,
      };

      return res.status(200).json({
        success: true,
        UImessage: "Store login successful!",
        user_type: "old store",
        user: store,
        tokens: {
          access: generateAccessToken(payload),
          refresh: generateRefreshToken(payload),
        },
      });
    } else {
      // NEW STORE signup logic
      const redisKey = `signup:temp:store:${phoneNo}`;
      const tempStoreDataStr = await redisClient.get(redisKey);

      if (tempStoreDataStr) {
        const tempStore = JSON.parse(tempStoreDataStr.toString());

        const newStore = await prisma.store.create({
          data: {
            phone_no: tempStore.phone_no,
            store_name: tempStore.store_name,
          }
        });

        await redisClient.del(redisKey);

        const payload = {
          role: 'store' as const,
          store_id: newStore.store_id,
        };

        return res.status(201).json({
          success: true,
          UImessage: "Store registration successful!",
          user_type: "new store",
          user: newStore,
          tokens: {
            access: generateAccessToken(payload),
            refresh: generateRefreshToken(payload),
          },
        });
      }

      return res.status(200).json({
        success: true,
        UImessage: "OTP verified. Please complete store registration.",
        user_type: "new store",
        phoneNo,
      });
    }
  } catch (error: any) {
    console.error("🔥 verifyStoreOtp Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Server error while verifying store OTP" });
  }
};

/**
 * @desc    STEP 3: Register a New Store - Step 1: Validate and Send OTP
 * @route   POST /stores/signup
 * @access  Public
 */
export const signUpStore = async (req: Request, res: Response) => {
  try {
    const { phoneNo, store_name } = req.body;
    
    if (!phoneNo || !store_name) {
      return res.status(400).json({ success: false, UImessage: "Phone and Store Name are required." });
    }

    const existingPhone = await prisma.store.findUnique({ where: { phone_no: phoneNo } });
    if (existingPhone) return res.status(400).json({ success: false, UImessage: "Phone number already exists." });

    const result = await triggerAuthOtpSend(phoneNo);
    if (!result.success) return res.status(result.status).json({ success: false, UImessage: result.message });

    const redisKey = `signup:temp:store:${phoneNo}`;
    const signupData = { phone_no: phoneNo, store_name };
    await redisClient.set(redisKey, JSON.stringify(signupData), { EX: 600 });

    return res.status(200).json({
      success: true,
      UImessage: "OTP sent. Please verify to complete store signup.",
      reqId: result.reqId,
      phoneNo,
    });
  } catch (error: any) {
    console.error("🔥 signUpStore Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Failed to initiate store signup." });
  }
};

/**
 * @desc    Login for existing store
 * @route   POST /stores/login
 * @access  Public
 */
export const loginStore = async (req: Request, res: Response) => {
  try {
    const { phone_no } = req.body;
    if (!phone_no) return res.status(400).json({ success: false, UImessage: "Phone number is required" });

    const store = await prisma.store.findUnique({ where: { phone_no } });
    if (!store) {
      return res.status(404).json({ success: false, UImessage: "Store not registered. Please sign up first." });
    }

    const result = await triggerAuthOtpSend(phone_no);
    return res.status(result.status).json({
      success: result.success,
      UImessage: result.message,
      reqId: result.reqId,
      phoneNo: phone_no,
    });
  } catch (error: any) {
    console.error("🔥 loginStore Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Server error during store login" });
  }
};

/**
 * @desc    Refresh Store Access Token
 */
export const refreshStoreToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, UImessage: "Refresh token required" });

    const { verifyRefreshToken } = await import("../services/jwtService.js");
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded || decoded.role !== 'store') {
      return res.status(401).json({ success: false, UImessage: "Invalid refresh token." });
    }

    const newAccessToken = generateAccessToken({
      role: 'store',
      store_id: decoded.store_id,
    });

    return res.status(200).json({ success: true, UImessage: "Token refreshed", access_token: newAccessToken });
  } catch (error: any) {
    return res.status(500).json({ success: false, UImessage: "Failed to refresh token" });
  }
};

/**
 * @desc    Get Store Profile
 */
export const getStoreProfile = async (req: Request, res: Response) => {
  try {
    const storeId = req.store_id;
    if (!storeId) return res.status(401).json({ success: false, UImessage: "Unauthorized" });

    const store = await prisma.store.findUnique({ where: { store_id: storeId } });
    if (!store) return res.status(404).json({ success: false, UImessage: "Store not found" });

    return res.status(200).json({ success: true, user: store });
  } catch (error: any) {
    return res.status(500).json({ success: false, UImessage: "Error fetching store profile" });
  }
};

// List all stores
export const listStores = async (req: Request, res: Response) => {
  try {
    const stores = await prisma.store.findMany();
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stores", details: err });
  }
};

// Get Store Menu
export const getStoreMenu = async (req: Request, res: Response) => {
  try {
    const storeId = parseInt(req.params.storeId!, 10);

    const menu = await prisma.menuItem.findMany({
      where: { store_id: storeId },
    });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu", details: err });
  }
};

// Get Store Orders
export const getStoreOrders = async (req: Request, res: Response) => {
  try {
    const storeId = req.store_id;

    if (!storeId) {
      return res.status(401).json({ success: false, UImessage: "Unauthorized." });
    }

    const orders = await prisma.order.findMany({
      where: { store_id: storeId },
      include: {
        items: { include: { menu_item: true } },
        customer: true,
      },
      orderBy: { order_date: 'desc' }
    });
    
    return res.json({
      success: true,
      UImessage: orders.length > 0 ? `Successfully fetched ${orders.length} orders.` : "No orders found.",
      orders
    });
  } catch (err) {
    console.error("🔥 getStoreOrders Error:", err);
    return res.status(500).json({ success: false, UImessage: "Failed to fetch orders." });
  }
};

import { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken } from "../services/jwtService.js";
import { triggerAuthOtpSend, verifyAuthOtp } from "../services/otpService.js";
import { Global } from "../config/global.js";
import * as UserService from "../services/userService.js";
import * as StoreService from "../services/storeService.js";

const isProduction = process.env.NODE_ENV === "production";
const development = process.env.NODE_ENV === "development";

/**
 * Helper: Sets Auth Cookies and Sends Response (Role-agnostic)
 */
const sendAuthResponse = (res: Response, user: any, role: 'customer' | 'store', statusCode: number, message: string, userType: string) => {
  const payload = {
    role: role,
    customer_id: role === 'customer' ? user.customer_id : undefined,
    store_id: role === 'store' ? user.store_id : undefined,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.cookie("accessToken", accessToken, Global.cookieOptions(isProduction, Global.AcessTokenExpireTime));
  res.cookie("refreshToken", refreshToken, Global.cookieOptions(isProduction, Global.RefreshTokenExpireTime));

  return res.status(statusCode).json({
    success: true,
    UImessage: message,
    user_type: userType,
    user,
  });
};

/**
 * @desc    Send OTP (Unified for both Customer and Store)
 * @route   POST /auth/send-otp
 * @access  Public
 */
export const sendOtp = async (req: Request, res: Response) => {
  const { phoneNo } = req.body;
  if (development) console.log("📥 OTP Request for:", phoneNo);

  const result = await triggerAuthOtpSend(phoneNo);
  return res.status(result.status).json({
    success: result.success,
    UImessage: result.message,
    reqId: result.reqId,
    phoneNo,
  });
};

/**
 * @desc    Verify OTP and Login/Signup (Unified)
 * @route   POST /auth/verify-otp
 * @access  Public
 */
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phoneNo, otp, reqId, role } = req.body;

    if (!phoneNo || !otp || !reqId) {
      return res.status(400).json({ success: false, UImessage: "Missing required fields." });
    }

    if (!role || (role !== 'customer' && role !== 'store')) {
      return res.status(400).json({ success: false, UImessage: "Invalid role. Must be 'customer' or 'store'." });
    }

    const verifyResult = await verifyAuthOtp(otp, reqId, phoneNo);
    if (!verifyResult.success) {
      return res.status(verifyResult.status).json({ success: false, UImessage: verifyResult.message });
    }

    // Route based on role
    if (role === 'customer') {
      const customer = await UserService.findCustomerByPhone(phoneNo);
      if (customer) {
        return sendAuthResponse(res, customer, 'customer', 200, "Login successful!", "customer");
      }

      const newCustomer = await UserService.completeSignupFromTempData(phoneNo);
      if (newCustomer) {
        return sendAuthResponse(res, newCustomer, 'customer', 201, "Registration successful!", "customer");
      }

      return res.status(200).json({
        success: true,
        UImessage: "OTP verified. Please complete your registration.",
        user_type: "customer",
        phoneNo,
      });
    } else {
      const store = await StoreService.findStoreByPhone(phoneNo);
      if (store) {
        return sendAuthResponse(res, store, 'store', 200, "Store login successful!", "store");
      }

      // const newStore = await StoreService.completeStoreSignupFromTempData(phoneNo);
      // if (newStore) {
      //   return sendAuthResponse(res, newStore, 'store', 201, "Store registration successful!", "store");
      // }

      return res.status(200).json({
        success: true,
        UImessage: "OTP verified. Please complete store registration.",
        user_type: "store",
        phoneNo,
      });
    }
  } catch (error: any) {
    console.error("🔥 verifyOtp Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Server error while verifying OTP" });
  }
};

/**
 * @desc    Signup (Unified)
 * @route   POST /auth/signup
 * @access  Public
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const { phoneNo, role, email, name, course, college, store_name } = req.body;

    if (!phoneNo || !role) {
      return res.status(400).json({ success: false, UImessage: "Phone number and role are required." });
    }

    if (role !== 'customer' && role !== 'store') {
      return res.status(400).json({ success: false, UImessage: "Invalid role. Must be 'customer' or 'store'." });
    }

    // Route based on role
    if (role === 'customer') {
      if (!email || !name) {
        return res.status(400).json({ success: false, UImessage: "Email and name are required for customer signup." });
      }

      const existingCustomer = await UserService.findCustomerByPhone(phoneNo);
      if (existingCustomer) {
        return res.status(400).json({ success: false, UImessage: "Phone number already registered." });
      }

      const result = await triggerAuthOtpSend(phoneNo);
      if (!result.success) {
        return res.status(result.status).json({ success: false, UImessage: result.message });
      }

      await UserService.storeTempSignupData(phoneNo, { phoneNo, email, name, course, college });

      return res.status(200).json({
        success: true,
        UImessage: "OTP sent successfully. Please verify to complete signup.",
        reqId: result.reqId,
        phoneNo,
      });
    } else {
      return res.status(400).json({ success: false, UImessage: "Store signup is currently disabled." });
    }
    // } else {
    //   if (!store_name) {
    //     return res.status(400).json({ success: false, UImessage: "Store name is required for store signup." });
    //   }

    //   const existingStore = await StoreService.findStoreByPhone(phoneNo);
    //   if (existingStore) {
    //     return res.status(400).json({ success: false, UImessage: "Phone number already registered." });
    //   }

    //   const result = await triggerAuthOtpSend(phoneNo);
    //   if (!result.success) {
    //     return res.status(result.status).json({ success: false, UImessage: result.message });
    //   }

    //   await StoreService.storeTempStoreData(phoneNo, { phone_no: phoneNo, store_name });

    //   return res.status(200).json({
    //     success: true,
    //     UImessage: "OTP sent. Please verify to complete store signup.",
    //     reqId: result.reqId,
    //     phoneNo,
    //   });
    // }
  } catch (error: any) {
    console.error("🔥 signup Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Failed to initiate signup." });
  }
};

/**
 * @desc    Login (Unified - checks existence and sends OTP)
 * @route   POST /auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { phoneNo, role } = req.body;

    if (!phoneNo || !role) {
      return res.status(400).json({ success: false, UImessage: "Phone number and role are required" });
    }

    if (role !== 'customer' && role !== 'store') {
      return res.status(400).json({ success: false, UImessage: "Invalid role. Must be 'customer' or 'store'." });
    }

    // Check existence based on role
    if (role === 'customer') {
      const customer = await UserService.findCustomerByPhone(phoneNo);
      if (!customer) {
        return res.status(404).json({ success: false, UImessage: "User not registered. Please sign up first." });
      }
    } else {
      const store = await StoreService.findStoreByPhone(phoneNo);
      if (!store) {
        return res.status(404).json({ success: false, UImessage: "Store not registered. Please sign up first." });
      }
    }

    const result = await triggerAuthOtpSend(phoneNo);
    return res.status(result.status).json({
      success: result.success,
      UImessage: result.message,
      reqId: result.reqId,
      phoneNo,
    });
  } catch (error: any) {
    console.error("🔥 login Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Server error during login" });
  }
};

/**
 * @desc    Refresh Access Token (Already role-agnostic)
 * @route   POST /auth/refresh
 * @access  Public (Requires valid refresh token in cookie)
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, UImessage: "Refresh token is required" });

    const { verifyRefreshToken } = await import("../services/jwtService.js");
    const decoded = verifyRefreshToken(token);

    if (!decoded) return res.status(401).json({ success: false, UImessage: "Invalid or expired refresh token." });

    const newAccessToken = generateAccessToken({
      role: decoded.role as any,
      customer_id: decoded.customer_id,
      store_id: decoded.store_id
    });

    res.cookie("accessToken", newAccessToken, Global.cookieOptions(isProduction, Global.AcessTokenExpireTime));

    return res.status(200).json({ success: true, UImessage: "Access token refreshed successfully" });
  } catch (error: any) {
    console.error("🔥 refreshToken Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Failed to refresh token" });
  }
};

/**
 * @desc    Get Current User Profile (Unified)
 * @route   GET /auth/me
 * @access  Private
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    const { role, customer_id, store_id } = req;

    if (role === "customer" && customer_id) {
      const customer = await UserService.findCustomerById(customer_id);
      if (!customer) return res.status(404).json({ success: false, UImessage: "Customer profile not found" });
      return res.status(200).json({ success: true, role, user: customer });
    }

    if (role === "store" && store_id) {
      const store = await StoreService.findStoreById(store_id);
      if (!store) return res.status(404).json({ success: false, UImessage: "Store profile not found" });
      return res.status(200).json({ success: true, role, user: store });
    }

    return res.status(401).json({ success: false, UImessage: "No valid role found in token" });
  } catch (error: any) {
    console.error("🔥 getMe Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Error fetching profile information" });
  }
};


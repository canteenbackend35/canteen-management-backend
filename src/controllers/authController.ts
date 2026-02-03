import express from "express";
import { generateAccessToken, generateRefreshToken } from "../services/jwtService.js";
import { triggerAuthOtpSend, verifyAuthOtp } from "../services/otpService.js";
import { Global } from "../config/global.js";
import * as UserService from "../services/userService.js";
import * as StoreService from "../services/storeService.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Helper: Finds a user (Customer or Store) based on role and phone number.
 */
const findUserByRole = async (role: 'customer' | 'store', phoneNo: string) => {
  return role === 'customer' 
    ? await UserService.findCustomerByPhone(phoneNo) 
    : await StoreService.findStoreByPhone(phoneNo);
};

/**
 * Helper: Sets Auth Cookies and Sends Response (Role-agnostic)
 */
const sendAuthResponse = (
  res: express.Response, 
  user: any, 
  role: 'customer' | 'store', 
  statusCode: number, 
  message: string
) => {
  const payload = {
    role,
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
    user_type: role,
    user,
  });
};

/**
 * @desc    Send OTP (Unified for both Customer and Store)
 * @route   POST /api/auth/send-otp
 */
export const sendOtp = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { phoneNo } = req.body;
  logger.debug("📥 OTP Request for: %s", phoneNo);

  const result = await triggerAuthOtpSend(phoneNo);
  if (!result.success) {
    throw new ApiError(result.status, result.message);
  }

  return res.status(200).json({
    success: true,
    UImessage: result.message,
    reqId: result.reqId,
    phoneNo,
  });
});

/**
 * @desc    Verify OTP and Login/Signup (Unified)
 * @route   POST /api/auth/verify-otp
 */
export const verifyOtp = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { phoneNo, otp, reqId, role } = req.body;

  const verifyResult = await verifyAuthOtp(otp, reqId, phoneNo);
  if (!verifyResult.success) {
    throw new ApiError(verifyResult.status, verifyResult.message);
  }

  // 1. Try to find existing user/store
  const user = await findUserByRole(role as 'customer' | 'store', phoneNo);
  if (user) {
    return sendAuthResponse(res, user, role as 'customer' | 'store', 200, `${role === 'store' ? 'Store login' : 'Login'} successful!`);
  }

  // 2. If customer exists in temp signup data, complete it
  if (role === 'customer') {
    const newCustomer = await UserService.completeSignupFromTempData(phoneNo);
    if (newCustomer) {
      return sendAuthResponse(res, newCustomer, 'customer', 201, "Registration successful!");
    }
  }

  // 3. Otherwise, OTP is verified but registration info is missing
  return res.status(200).json({
    success: true,
    UImessage: "OTP verified. Please complete your registration.",
    user_type: role,
    phoneNo,
  });
});

/**
 * @desc    Signup (Unified - Currently handles Customer only)
 * @route   POST /api/auth/signup
 */
export const signup = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { phoneNo, role, email, name, course, college } = req.body;

  if (role === 'customer') {
    const existingCustomer = await UserService.findCustomerByPhone(phoneNo);
    if (existingCustomer) throw new ApiError(400, "Phone number already registered.");

    const result = await triggerAuthOtpSend(phoneNo);
    if (!result.success) throw new ApiError(result.status, result.message);

    await UserService.storeTempSignupData(phoneNo, { phoneNo, email, name, course, college });

    return res.status(200).json({
      success: true,
      UImessage: "OTP sent successfully. Please verify to complete signup.",
      reqId: result.reqId,
      phoneNo,
    });
  }

  // Store signup can be enabled here using StoreService.storeTempStoreData
  throw new ApiError(400, "Store signup is currently disabled via this route.");
});

/**
 * @desc    Login (Unified - checks existence and sends OTP)
 * @route   POST /api/auth/login
 */
export const login = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { phoneNo, role } = req.body;

  const user = await findUserByRole(role as 'customer' | 'store', phoneNo);
  if (!user) {
    throw new ApiError(404, `${role === 'store' ? 'Store' : 'User'} not registered. Please sign up first.`);
  }

  const result = await triggerAuthOtpSend(phoneNo);
  if (!result.success) throw new ApiError(result.status, result.message);

  return res.status(200).json({
    success: true,
    UImessage: result.message,
    reqId: result.reqId,
    phoneNo,
  });
});

/**
 * @desc    Refresh Access Token
 * @route   POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: express.Request, res: express.Response) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new ApiError(401, "Refresh token is required.");

  const { verifyRefreshToken } = await import("../services/jwtService.js");
  const decoded = verifyRefreshToken(token);
  if (!decoded) throw new ApiError(401, "Invalid or expired refresh token.");

  const newAccessToken = generateAccessToken({
    role: decoded.role as any,
    customer_id: decoded.customer_id,
    store_id: decoded.store_id
  });

  res.cookie("accessToken", newAccessToken, Global.cookieOptions(isProduction, Global.AcessTokenExpireTime));

  return res.status(200).json({
    success: true,
    UImessage: "Access token refreshed successfully."
  });
});

/**
 * @desc    Get Current User Profile
 * @route   GET /api/auth/me
 */
export const getMe = asyncHandler(async (req: express.Request, res: express.Response) => {
  const { role, customer_id, store_id } = req;

  if (role === "customer" && customer_id) {
    const customer = await UserService.findCustomerById(customer_id);
    if (!customer) throw new ApiError(404, "Customer profile not found.");
    return res.status(200).json({ success: true, role, user: customer , customer });
  }

  if (role === "store" && store_id) {
    const store = await StoreService.findStoreById(store_id);
    if (!store) throw new ApiError(404, "Store profile not found.");
    return res.status(200).json({ success: true, role, user: store , store});
  }

  throw new ApiError(401, "No valid session found.");
});

import { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken } from "../services/jwtService.js";
import { triggerAuthOtpSend, verifyAuthOtp } from "../services/otpService.js";
import { Global } from "../config/global.js";
import * as UserService from "../services/userService.js";

const isProduction = process.env.NODE_ENV === "production";
const development = process.env.NODE_ENV === "development";

/**
 * Helper: Sets Auth Cookies and Sends Response
 */
const sendAuthResponse = (res: Response, user: any, statusCode: number, message: string, userType: string) => {
  const payload = {
    role: 'customer' as const,
    customer_id: user.customer_id,
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
 * @desc    STEP 1: Send OTP to user's phone number
 */
export const sendOtp = async (req: Request, res: Response) => {
  const { phoneNo } = req.body;
  if (development) console.log("📥 Generic OTP Request for:", phoneNo);

  const result = await triggerAuthOtpSend(phoneNo);
  return res.status(result.status).json({
    success: result.success,
    UImessage: result.message,
    reqId: result.reqId,
    phoneNo,
  });
};

/**
 * @desc    STEP 2: Verify OTP and Perform Login or Redirect to Signup
 */
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phoneNo, otp, reqId } = req.body;

    if (!phoneNo || !otp || !reqId) {
      return res.status(400).json({ success: false, UImessage: "Missing required fields." });
    }

    const verifyResult = await verifyAuthOtp(otp, reqId, phoneNo);

    if (!verifyResult.success) {
      return res.status(verifyResult.status).json({ success: false, UImessage: verifyResult.message });
    }

    const customer = await UserService.findCustomerByPhone(phoneNo);

    if (customer) {
      return sendAuthResponse(res, customer, 200, "Login successful!", "old user");
    }

    const newUser = await UserService.completeSignupFromTempData(phoneNo);
    if (newUser) {
      return sendAuthResponse(res, newUser, 201, "Registration successful!", "new user");
    }

    return res.status(200).json({
      success: true,
      UImessage: "OTP verified. Please complete your registration.",
      user_type: "new user",
      phoneNo,
    });
  } catch (error: any) {
    console.error("🔥 verifyOtp Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Server error while verifying OTP" });
  }
};

/**
 * @desc    STEP 3: Register a New User (Signup)
 */
export const signUpUser = async (req: Request, res: Response) => {
  try {
    const { phoneNo, email, name, course, college } = req.body;

    if (!phoneNo || !email || !name) {
      return res.status(400).json({ success: false, UImessage: "Phone, Email, and Name are required." });
    }

    const existingUser = await UserService.findCustomerByPhone(phoneNo);
    if (existingUser) return res.status(400).json({ success: false, UImessage: "Phone number already exists." });

    const result = await triggerAuthOtpSend(phoneNo);
    if (!result.success) return res.status(result.status).json({ success: false, UImessage: result.message });

    await UserService.storeTempSignupData(phoneNo, { phoneNo, email, name, course, college });

    return res.status(200).json({
      success: true,
      UImessage: "OTP sent successfully. Please verify to complete signup.",
      reqId: result.reqId,
      phoneNo,
    });
  } catch (error: any) {
    console.error("🔥 signUpUser Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Failed to initiate signup." });
  }
};

/**
 * @desc    Fetch Orders for the logged-in user
 */
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const customerId = req.customer_id;
    if (!customerId) return res.status(401).json({ success: false, UImessage: "Authentication failed." });

    const orders = await UserService.getCustomerOrdersWithDetails(customerId);

    return res.status(200).json({
      success: true,
      UImessage: orders.length > 0 ? `Successfully fetched ${orders.length} orders.` : "No orders found.",
      orders
    });
  } catch (error: any) {
    console.error("🔥 getUserOrders Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Error while fetching your orders." });
  }
};

/**
 * @desc    Refresh access token
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
 * @desc    Get user profile data
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const customerId = req.customer_id;
    if (!customerId) return res.status(401).json({ success: false, UImessage: "Authentication failed." });

    const customer = await UserService.findCustomerById(customerId);
    if (!customer) return res.status(404).json({ success: false, UImessage: "User profile not found." });

    return res.status(200).json({ success: true, UImessage: "Profile fetched successfully.", user: customer });
  } catch (error: any) {
    console.error("🔥 getUserProfile Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Error fetching profile." });
  }
};

/**
 * @desc    Login Step 1: Check if user exists and Send OTP
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { phone_no } = req.body;
    if (!phone_no) return res.status(400).json({ success: false, UImessage: "Phone number is required" });

    const customer = await UserService.findCustomerByPhone(phone_no);
    if (!customer) return res.status(404).json({ success: false, UImessage: "User not registered. Please sign up first." });

    const result = await triggerAuthOtpSend(phone_no);
    return res.status(result.status).json({
      success: result.success,
      UImessage: result.message,
      reqId: result.reqId,
      phoneNo: phone_no,
    });
  } catch (error: any) {
    console.error("🔥 loginUser Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Server error during login" });
  }
};
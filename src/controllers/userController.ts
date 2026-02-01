import { Request, Response } from "express";
import prisma from "../config/prisma_client.js";
import redisClient from "../config/redisClient.js";
import { generateAccessToken, generateRefreshToken } from "../services/jwtService.js";
import { triggerAuthOtpSend } from "../services/otpService.js";
import OTPWidget from "../config/msg91_client.js";

/**
 * @desc    STEP 1: Send OTP to user's phone number
 * @route   POST /users/send-otp
 * @access  Public
 */
export const sendOtp = async (req: Request, res: Response) => {
  const { phoneNo } = req.body;
  console.log("📥 Generic OTP Request for:", phoneNo);
  
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
 * @route   POST /users/verify-otp
 * @access  Public
 */
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phoneNo, otp, reqId } = req.body;

    if (!phoneNo || !otp || !reqId) {
      return res.status(400).json({ success: false, UImessage: "Missing required fields." });
    }

    // 1. Verify OTP with Provider
    const verifyResponse: any = await OTPWidget.verifyOTP({ otp, reqId });

    if (verifyResponse.type === "error") {
      return res.status(400).json({ 
        success: false, 
        UImessage: verifyResponse.message || "OTP verification failed." 
      });
    }

    // 2. Clear Rate Limits on Success
    await redisClient.del(`otp:limit:${phoneNo}`);

    // 3. User Identification (Login or New User)
    const customer = await prisma.customer.findUnique({ where: { phone_no: phoneNo } });

    if (customer) {
      // --- LOGIC: LOGIN (Existing User) ---
      const payload: any = {
        role: 'customer',
        customer_id: customer.customer_id,
        phone_no: customer.phone_no,
        email: customer.email,
        course: customer.course,
        college: customer.college,
        name: customer.name,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false, // development
        sameSite: "lax",
        maxAge: 15 * 60 * 1000, // 15 mins
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        success: true,
        UImessage: "Login successful!",
        user_type: "old user",
        user: customer,
      });
    } else {
      // --- LOGIC: NEW USER (Check for pending signup details in Redis) ---
      const redisKey = `signup:temp:${phoneNo}`;
      const tempUserDataStr = await redisClient.get(redisKey);

      if (tempUserDataStr) {
        const tempUser = JSON.parse(tempUserDataStr.toString());

        // Create User from temp data
        const newUser = await prisma.customer.create({
          data: {
            phone_no: tempUser.phone_no,
            email: tempUser.email,
            name: tempUser.name,
            course: tempUser.course || null,
            college: tempUser.college || null,
          }
        });

        // Delete temp data from Redis
        await redisClient.del(redisKey);

        const payload: any = {
          role: 'customer',
          customer_id: newUser.customer_id,
          phone_no: newUser.phone_no,
          email: newUser.email,
          course: newUser.course,
          college: newUser.college,
          name: newUser.name,
        };

        const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        success: true,
        UImessage: "Registration successful!",
        user_type: "new user",
        user: newUser,
      });
      }

      // If no temp data found, just inform that OTP is verified
      return res.status(200).json({
        success: true,
        UImessage: "OTP verified. Please complete your registration.",
        user_type: "new user",
        phoneNo,
      });
    }
  } catch (error: any) {
    console.error("🔥 verifyOtp Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Server error while verifying OTP" });
  }
};

/**
 * @desc    STEP 3: Register a New User (Signup) - Step 1: Validate and Send OTP
 * @route   POST /users/signup
 * @access  Public
 */
export const signUpUser = async (req: Request, res: Response) => {
  try {
    const { phoneNo, email, name, course, college } = req.body;
    
    if (!phoneNo || !email || !name) {
      return res.status(400).json({ success: false, UImessage: "Phone, Email, and Name are required." });
    }

    // 1. Ensure phone number and email uniqueness
    const existingPhoneNo = await prisma.customer.findUnique({ where: { phone_no: phoneNo } });
    if (existingPhoneNo) {
      return res.status(400).json({ success: false, UImessage: "Phone number already exists." });
    }

    const existingEmail = await prisma.customer.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ success: false, UImessage: "Email already exists." });
    }

    // 2. Send OTP First
    console.log("📥 Signup OTP Request for:", phoneNo);
    const result = await triggerAuthOtpSend(phoneNo);

    if (!result.success) {
      return res.status(result.status).json({ success: false, UImessage: result.message });
    }

    // 3. Store details in Redis only if OTP was sent successfully (TTL 10 mins)
    const redisKey = `signup:temp:${phoneNo}`;
    const signupData = { phone_no: phoneNo, email, name, course, college };
    await redisClient.set(redisKey, JSON.stringify(signupData), { EX: 600 });

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
 * @route   GET /users/orders
 * @access  Private (Requires Auth Token)
 */
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const customerId = req.customer_id;

    if (!customerId) {
      return res.status(401).json({ 
        success: false, 
        UImessage: "Authentication failed. Please log in again." 
      });
    }

    const orders = await prisma.order.findMany({
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

    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        UImessage: "You haven't placed any orders yet.",
        orders: []
      });
    }

    return res.status(200).json({
      success: true,
      UImessage: `Successfully fetched ${orders.length} order(s).`,
      orders
    });
  } catch (error: any) {
    console.error("🔥 getUserOrders Error:", error.message);
    return res.status(500).json({ 
      success: false, 
      UImessage: "We encountered an error while fetching your orders. Please try again later." 
    });
  }
};

/**
 * @desc    Refresh access token using a valid refresh token
 * @route   POST /users/refresh
 * @access  Public (Requires valid refresh token)
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    console.log("🔄 Refresh token request received via cookies");

    if (!refreshToken) {
      return res.status(401).json({ success: false, UImessage: "Refresh token is required" });
    }

    // Verify refresh token
    const { verifyRefreshToken } = await import("../services/jwtService.js");
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      console.log("❌ Invalid or expired refresh token");
      return res.status(401).json({ 
        success: false, 
        UImessage: "Invalid or expired refresh token. Please log in again." 
      });
    }

    // Generate new access token with same payload
    const newAccessToken = generateAccessToken({
      role: decoded.role as any,
      customer_id: decoded.customer_id,
      store_id: decoded.store_id,
      phone_no: decoded.phone_no,
      email: decoded.email,
      course: decoded.course,
      college: decoded.college,
      name: decoded.name,
    });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    console.log("✅ New access token generated and set in cookie");
    
    return res.status(200).json({
      success: true,
      UImessage: "Access token refreshed successfully",
    });
  } catch (error: any) {
    console.error("🔥 refreshToken Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Failed to refresh token" });
  }
};

/**
 * @desc    Get user profile data
 * @route   GET /users/profile
 * @access  Private
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const customerId = req.customer_id;

    if (!customerId) {
      return res.status(401).json({ success: false, UImessage: "Authentication failed. Please log in again." });
    }

    const customer = await prisma.customer.findUnique({
      where: { customer_id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ success: false, UImessage: "We couldn't find your profile details." });
    }

    return res.status(200).json({
      success: true,
      UImessage: "Profile details fetched successfully.",
      user: customer,
    });
  } catch (error: any) {
    console.error("🔥 getUserProfile Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Error fetching profile. Please try again later." });
  }
};

/**
 * @desc    Login Step 1: Check if user exists and Send OTP
 * @route   POST /users/login
 * @access  Public
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { phone_no } = req.body;

    if (!phone_no) {
      return res.status(400).json({ success: false, UImessage: "Phone number is required" });
    }

    // 1. Check if user exists
    const customer = await prisma.customer.findUnique({
      where: { phone_no },
    });

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        UImessage: "This phone number is not registered. Please sign up first." 
      });
    }

    // 2. If user exists, send OTP
    console.log("📥 Login OTP Request for:", phone_no);
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

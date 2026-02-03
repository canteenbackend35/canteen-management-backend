import { z } from "zod";
import { phoneSchema, roleSchema } from "./common.js";

/**
 * Schema for sending OTP
 */
export const sendOtpSchema = z.object({
  body: z.object({
    phoneNo: phoneSchema,
  }),
});

/**
 * Schema for verifying OTP
 */
export const verifyOtpSchema = z.object({
  body: z.object({
    phoneNo: phoneSchema,
    otp: z.string().min(4, "OTP is required"),
    reqId: z.string().min(1, "Request ID is required"),
    role: roleSchema,
  }),
});

/**
 * Schema for Customer/Store Login
 */
export const loginSchema = z.object({
  body: z.object({
    phoneNo: phoneSchema,
    role: roleSchema,
  }),
});

/**
 * Schema for Signup
 */
export const signupSchema = z.object({
  body: z.object({
    phoneNo: phoneSchema,
    role: roleSchema,
    email: z.string().email("Invalid email address").optional(),
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    course: z.string().nullable().optional(),
    college: z.string().nullable().optional(),
  }).refine((data) => {
    if (data.role === 'customer') {
      return !!data.email && !!data.name;
    }
    return true;
  }, {
    message: "Email and name are required for customer signup",
    path: ["email"],
  }),
});

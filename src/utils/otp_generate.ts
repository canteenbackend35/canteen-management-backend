// utils/generateOtp.ts
import crypto from "crypto";

export const generateOtp = (): string => {
  // Generate a 6-digit OTP (between 100000 and 999999)
  const otp = crypto.randomInt(100000, 999999).toString();

  // Optional: extra safety check
  if (!otp || otp.length !== 6) {
    console.error("Error generating OTP");
  }

  return otp;
};

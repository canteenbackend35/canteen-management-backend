import crypto from "crypto";

/**
 * Generate a secure random OTP for orders
 * @param length - Length of OTP (default: 4)
 * @returns Random numeric OTP as string
 */
export function generateOtp(length: number = 4): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  
  // Generate cryptographically secure random number
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  
  // Map to desired range
  const otp = min + (randomNumber % (max - min + 1));
  
  return otp.toString();
}

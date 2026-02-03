import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
dotenv.config();

// -------------------
// Types
// -------------------
export interface JwtPayload {
  role: 'customer' | 'store';
  customer_id?: number;
  store_id?: number;
  phone_no?: string;
  email?: string;
  name?: string;
  course?: string | null;
  college?: string | null;
}

// -------------------
// Configs
// -------------------
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN!;
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN!;

// -------------------
// Token generation
// -------------------
function signToken(payload: JwtPayload, secret: string, expiresIn: string) {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
}

export const generateAccessToken = (payload: JwtPayload) =>
  signToken(payload, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES_IN);

export const generateRefreshToken = (payload: JwtPayload) =>
  signToken(payload, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRES_IN);

// -------------------
// Token verification
// -------------------
function verifyToken(token: string, secret: string): JwtPayload | null {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (err: any) {
    logger.warn("Token verification failed: %s", err.message);
    return null;
  }
}

export const verifyAccessToken = (token: string) =>
  verifyToken(token, ACCESS_TOKEN_SECRET);

export const verifyRefreshToken = (token: string) =>
  verifyToken(token, REFRESH_TOKEN_SECRET);

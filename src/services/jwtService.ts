import jwt from "jsonwebtoken";

// Define the payload type
interface JwtPayload {
  customer_id: number;
  phone_no: string;
  course: string | null; // allow null
  college: string | null; // allow null
  name: string;
}

// Secret key (in production, store in env variables)
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Generate JWT
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET);
}

// Verify JWT
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    console.error("Invalid token", err);
    return null;
  }
}

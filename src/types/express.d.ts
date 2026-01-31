import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      email?: string;
      phone_no?: string;
      customer_id?: number;
    }
  }
}

import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      role?: 'customer' | 'store';
      email?: string;
      phone_no?: string;
      customer_id?: number;
      store_id?: number;
    }
  }
}

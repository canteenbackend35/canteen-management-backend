import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to check if the authenticated user is a Store
 */
export const isStore = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (req.role !== "store") {
    throw new ApiError(403, "Access denied. Only stores can perform this action.");
  }
  next();
});

/**
 * Middleware to check if the authenticated user is a Customer
 */
export const isCustomer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (req.role !== "customer") {
    throw new ApiError(403, "Access denied. Only customers can perform this action.");
  }
  next();
});

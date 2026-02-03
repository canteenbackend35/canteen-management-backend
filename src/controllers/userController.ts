import express from "express";
import * as UserService from "../services/userService.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc    Fetch Orders for the logged-in user
 * @route   GET /users/orders
 * @access  Private
 */
export const getUserOrders = asyncHandler(async (req: express.Request, res: express.Response) => {
  const customerId = req.customer_id;
  if (!customerId) throw new ApiError(401, "Authentication failed.");

  const orders = await UserService.getCustomerOrdersWithDetails(customerId);

  return res.status(200).json({
    success: true,
    UImessage: orders.length > 0 ? `Successfully fetched ${orders.length} orders.` : "No orders found.",
    orders
  });
});
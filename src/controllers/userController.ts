import { Request, Response } from "express";
import * as UserService from "../services/userService.js";

/**
 * @desc    Fetch Orders for the logged-in user
 * @route   GET /users/orders
 * @access  Private
 */
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const customerId = req.customer_id;
    if (!customerId) return res.status(401).json({ success: false, UImessage: "Authentication failed." });

    const orders = await UserService.getCustomerOrdersWithDetails(customerId);

    return res.status(200).json({
      success: true,
      UImessage: orders.length > 0 ? `Successfully fetched ${orders.length} orders.` : "No orders found.",
      orders
    });
  } catch (error: any) {
    console.error("🔥 getUserOrders Error:", error.message);
    return res.status(500).json({ success: false, UImessage: "Error while fetching your orders." });
  }
};
import { Request, Response } from "express";
import prisma from "../config/prisma_client.js";
import { supabase } from "../config/supabaseClient.js";

// Get Orders of User
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log(email);

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "cc://auth/callback",
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: "Magic link sent to email" });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to send magic link",
      details: err,
    });
  }
};

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const email = req.email;

    console.log("Fetching orders for email:", email);

    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const orders = await prisma.order.findMany({
      where: { customer_id: customer.customer_id },
      include: {
        items: {
          include: {
            menu_item: true,
          },
        },
        store: true,
      },
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders", details: err });
  }
};

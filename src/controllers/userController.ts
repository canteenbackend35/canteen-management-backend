import { Request, Response } from "express";
import prisma from "../config/prisma_client.js";
import { supabase } from "../config/supabaseClient.js";
import { Global } from "../config/global.js";

// Login User
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    // Check in Prisma DB
    const userExists = await prisma.customer.findUnique({
      where: { email },
    });

    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    // Now send Supabase Magic Link
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: Global.emailRedirectTo,
      },
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ message: "Magic link sent" });
  } catch (err) {
    return res.status(500).json({ error: "Failed", details: err });
  }
};

export const signUpUser = async (req: Request, res: Response) => {
  try {
    const { email, name, phone_no, course, college } = req.body;

    if (!email || !phone_no || !name) {
      return res.status(400).json({
        error: "email, phone_no, and name are required",
      });
    }

    const existing = await prisma.customer.findFirst({
      where: {
        OR: [{ email }, { phone_no }],
      },
    });

    if (existing) {
      return res.status(400).json({
        error: "User already exists with this email or phone number",
      });
    }

    const user = await prisma.customer.create({
      data: {
        email,
        phone_no,
        name,
        course: course || null,
        college: college || null,
      },
    });

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: Global.emailRedirectTo,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: "User created. Magic link sent to email.",
      user,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to sign up user",
      details: err instanceof Error ? err.message : err,
    });
  }
};

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const email = req.email;

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

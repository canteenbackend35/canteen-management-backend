import { log } from "console";
import { supabase } from "../config/supabaseClient.js";

export async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader) {
      console.log("No auth header");
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("No token found in auth header");
      return res.status(401).json({ error: "Token missing" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.log("Invalid token or user not found", error);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = data.user; // attach authenticated user
    req.email = data.user.email;
    log("Authenticated user email:", req.email);
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Server authentication error" });
  }
}

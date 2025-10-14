import { Request, Response } from "express";
import prisma from "../config/prisma_client.js";
import redisClient from "../config/redisClient.js";
import { generateOtp } from "../utils/otp_generate.js";

//send otp endpoint controller - to be completed by ayush

//will generate and send the otp via SMS
//will store the OTP and the corresponding phone number in the redis for checking later and set its expiry to 2 mins
//send message to the frontend {phoneNo:"XXXXX-XXXXX", message: "OTP successfully sent!"}

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { phoneNo } = req.body;

    // validate phone number
    if (!phoneNo || !/^[0-9]{10}$/.test(phoneNo)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid phone number" });
    }

    // generate otp
    const otp = generateOtp();
    if (!otp || typeof otp !== "string" || otp.length === 0) {
      console.log("❌ OTP generation failed:", otp);
      return res
        .status(500)
        .json({ success: false, message: "OTP generation failed" });
    }
    console.log("🔢 OTP generated:", otp);

    // store in redis
    const redisResponse = await redisClient.set(
      `phoneNo:${String(phoneNo)}`,
      String(otp)
    );

    if (!redisResponse) {
      console.log("❌ Failed to insert OTP into Redis");
    } else {
      console.log("🧠 OTP inserted into Redis successfully");
    }

    // send otp via sms (simulate for now)
    const smsResponse = await sendOtpSms({ otp });
    if (!smsResponse) {
      console.log("❌ Failed to send OTP SMS");
    } else {
      console.log("📤 OTP SMS sent successfully");
    }

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("🔥 sendOtp failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error while sending OTP" });
  }
};

//validate-otp and identify new or old user endpoint controller - to be completed by vishal

//this endpoint will take the user otp and phone number from the frontend and check wether the otp matches in the redis!(the above endpoint will store the otp and phone no in the redis)
//if his number cannot be found in the redis db then he the otp has expired and send the appropriate response to the frontend: {phoneNo:"XXXXX-XXXXX", message: "You took too long! OTP expired"}
//if his otp does not match then also send an appropriate response to the frontend: {phoneNo:"XXXXX-XXXXX", message: "OTP does not match!"}
//if it matches then it will check wether the user already exists in the db
//if new user it will send the message to the frontend that it is a new user with his phoneNo verified and redirect him to signup/form-data page: {phoneNo:"XXXXX-XXXXX", message: "OTP matched successfully!!", user_type: "new user"}
//if old user then backend will generate his jwt tokens (access + refresh) and send it to the frontend so that the frontend can then redirect him to his dashboard: {phoneNo:"XXXXX-XXXXX", message: "OTP matched successfully!!", user_type: "old user", tokens:{access: "xxxxxxxxxxxxxxx", refresh: "xxxxxxxxxxxxxxxxxx"}}
//remember to handle checkpoints!

//handle new-user data endpoint controller - to be assigned yet!

//will get all the user details along with the phone number we send in the above endpoint!
//and store it in supabase database
//and send his tokens along with a success message!

// Get Orders of User
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId!, 10);
    const orders = await prisma.order.findMany({
      where: { customer_id: userId },
      include: { items: true },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders", details: err });
  }
};

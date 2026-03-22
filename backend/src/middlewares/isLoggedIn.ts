import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { userModel } from "../models/userModel.js";

dotenv.config();

// We MUST extend Request so TypeScript allows us to add `req.user`
export interface CustomRequest extends Request {
  user?: any;
}

export const isLoggedIn = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. We named the cookie "accessToken" in authController.ts
    const token = req.cookies?.accessToken;
    
    if (!token) {
      res.status(401).json({ status: "error", message: "Unauthorized: No token provided" });
      return; 
    }

    // 2. Decode the token to get the payload { id, name, email }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)as any;

    // 3. (Optional but good) Verify the user still exists in the DB
    const user_data = await userModel.findByEmail(decoded.email);
    
    if (!user_data) {
      res.status(401).json({ status: "error", message: "User no longer exists" });
      return; // MUST return
    }

    // 4. Attach user data to req and proceed
    req.user = user_data;
    next();
  } catch (err) {
    res.status(401).json({ status: "error", message: "Unauthorized: Invalid or expired token" });
  }
};

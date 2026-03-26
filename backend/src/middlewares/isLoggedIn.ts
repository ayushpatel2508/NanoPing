import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { userModel } from "../models/userModel.js";

dotenv.config();

export interface CustomRequest extends Request {
  user?: any;
}

export const isLoggedIn = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken && !refreshToken) {
      console.warn("[AUTH] Unauthorized: No tokens found in cookies");
      res.status(401).json({ status: "error", message: "Unauthorized: Please log in" });
      return;
    }

    let decoded: any = null;
    let usedRefreshToken = false;

    // 1. Try verifying Access Token first
    if (accessToken) {
      try {
        decoded = jwt.verify(accessToken, process.env.JWT_SECRET!);
      } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
          console.log("[AUTH] Access token expired, attempting refresh...");
        } else {
          console.warn("[AUTH] Access token invalid:", err.message);
        }
      }
    }

    // 2. If Access Token failed/expired, try Refresh Token
    if (!decoded && refreshToken) {
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!);
        usedRefreshToken = true;
      } catch (err: any) {
        console.warn("[AUTH] Refresh token failed:", err.message);
      }
    }

    // 3. If still no valid decoded data, both tokens failed
    if (!decoded) {
      console.error("[AUTH] Identification failed: Both tokens invalid/expired");
      res.status(401).json({ status: "error", message: "Session expired. Please log in again." });
      return;
    }

    // 4. Verify user exists in the DB
    const user_data = await userModel.findById(decoded.id);
    if (!user_data) {
      console.warn(`[AUTH] User ID ${decoded.id} not found in database`);
      res.status(401).json({ status: "error", message: "Account not found" });
      return;
    }

    // 5. If we used the Refresh Token to get here, SILENTLY issue a new Access Token
    if (usedRefreshToken) {
      const newAccessToken = jwt.sign(
        { id: user_data.id, name: user_data.name, email: user_data.email },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" } // Standard short expiry for security
      );

      const cookieOptions: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/"
      };

      // Set for 24h in dev to avoid annoying frequent refreshes, but follow prod rules for prod
      const accessMaxAge = process.env.NODE_ENV === "production" ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000;

      res.cookie("accessToken", newAccessToken, {
        ...cookieOptions,
        maxAge: accessMaxAge
      });
      
      console.log(`[AUTH] Silent refresh: New access token issued for ${user_data.email}`);
    }

    // 6. Attach user data to req and proceed
    req.user = user_data;
    next();

  } catch (err: any) {
    console.error("[AUTH] Unexpected error in middleware:", err.message);
    res.status(500).json({ status: "error", message: "Internal server error during authentication" });
  }
};

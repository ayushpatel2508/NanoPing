import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { userModel } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import type { CustomRequest } from "../middlewares/isLoggedIn.js";

/**
 * [HELPER] setAuthCookies
 * Centralizes JWT generation, database refresh token updates, and cookie setting.
 */
const setAuthCookies = async (res: Response, user: { id: string; name: string; email: string }, skipDbUpdate: boolean = false) => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    console.error("[AUTH ERROR] Missing JWT Secrets in environment variables.");
    throw new Error("Internal server configuration error.");
  }

  const accessToken = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    accessSecret,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    refreshSecret,
    { expiresIn: "7d" }
  );

  // 1. Update the database if not already handled by a transactional creation
  if (!skipDbUpdate) {
    await userModel.updateRefreshToken(user.id, refreshToken);
  }

  const isProd = process.env.NODE_ENV === "production";

  const cookieOptions: any = {
    httpOnly: true,
    secure: isProd, 
    sameSite: isProd ? "none" : "lax", 
    path: "/",
  };

  const accessMaxAge = isProd ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000;

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: accessMaxAge,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ status: "error", message: "Email, password, and name are required." });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ status: "error", message: "Password must be at least 8 characters long." });
      return;
    }

    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ status: "error", message: "Email already exists." });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ATOMICITY: Generate tokens BEFORE creating the user in DB
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!accessSecret || !refreshSecret) {
      console.error("[AUTH] Missing JWT secrets on server.");
      res.status(500).json({ status: "error", message: "Internal server error" });
      return;
    }

    const refreshToken = jwt.sign({ email }, refreshSecret, { expiresIn: '7d' });

    // Create the user with the refreshToken in a SINGLE query
    const newUser = await userModel.create(email, passwordHash, name, refreshToken);

    // Finalize tokens and cookies
    const tokens = await setAuthCookies(res, newUser, true); // skipDbUpdate: true

    console.log(`[AUTH] User ${newUser.email} registered atomicially.`);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        accessToken: tokens.accessToken
      }
    });
  } catch (error: any) {
    console.error("[AUTH] Registration error:", error);
    res.status(500).json({ 
      status: "error", 
      message: "An internal server error occurred" 
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ status: "error", message: "Email and password are required" });
      return;
    }

    const user_exist = await userModel.findByEmail(email);
    if (!user_exist) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    if (!user_exist.password_hash) {
      res.status(400).json({ status: "error", message: "Please log in using your Google/Clerk account." });
      return;
    }

    const password_match = await bcrypt.compare(password, user_exist.password_hash);
    if (!password_match) {
      res.status(401).json({ status: "error", message: "Invalid password" });
      return;
    }

    // Set cookies using our helper
    const tokens = await setAuthCookies(res, user_exist);

    console.log(`[AUTH] User ${user_exist.email} logged in successfully.`);

    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      data: {
        id: user_exist.id,
        email: user_exist.email,
        name: user_exist.name,
        accessToken: tokens.accessToken
      }
    });
  } catch (err: any) {
    console.error("[AUTH] Login error:", err);
    res.status(500).json({ 
      status: "error", 
      message: "Internal server error" 
    });
  }
};

export const getUser = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const user_data = req.user;

    if (!user_data) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    res.status(200).json({ status: "success", data: user_data });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("accessToken", {
       httpOnly: true,
       secure: process.env.NODE_ENV === "production",
       sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
       path: "/"
    });
    res.clearCookie("refreshToken", {
       httpOnly: true,
       secure: process.env.NODE_ENV === "production",
       sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
       path: "/"
    });
    res.status(200).json({ status: "success", message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout err", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export const clerkSync = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clerkId, email, name } = req.body;

    if (!clerkId || !email) {
      res.status(400).json({ status: "error", message: "Clerk ID and Email are required" });
      return;
    }

    let user = await userModel.findByClerkId(clerkId);

    if (!user) {
      user = await userModel.findByEmail(email);

      if (user) {
        await userModel.updateClerkId(user.id, clerkId);
        user.clerk_id = clerkId;
      } else {
        user = await userModel.createFromClerk(clerkId, email, name || "Clerk User");
      }
    }

    // Set cookies using our helper
    await setAuthCookies(res, user);

    console.log(`[AUTH] Clerk user ${user.email} synced and logged in successfully.`);

    res.status(200).json({
      status: "success",
      message: "Clerk sync successful",
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        clerk_id: user.clerk_id
      }
    });

  } catch (err) {
    console.error("Clerk sync error:", err);
    res.status(500).json({ status: "error", message: "Internal server error during Clerk sync" });
  }
};
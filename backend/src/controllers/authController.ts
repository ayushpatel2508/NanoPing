import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { userModel } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import type { CustomRequest } from "../middlewares/isLoggedIn.js";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // 1. Basic validation (You can expand this with Zod/Joi later)
    if (!email || !password || !name) {
      res.status(400).json({
        status: "error",
        message: "Email, password, and name are required."
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        status: "error",
        message: "Password must be at least 8 characters long."
      });
      return;
    }

    // 2. Check if user already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        status: "error",
        message: "Email already exists."
      });
      return;
    }

    // 3. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Create the user in the database
    const newUser = await userModel.create(email, passwordHash, name);

    // 5. Send success response matching the documentation
    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: newUser
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: "An internal server error occurred"
    });
  }
};

export const login=async(req:Request,res:Response): Promise<void>=>{
    try{
      const {email,password}=req.body;

      if(!email|| !password){
        res.status(400).json({
          status:"error",
          message:"Email and password are required"
          })
          return;

        }
      
        const user_exist=await userModel.findByEmail(email);
        if(!user_exist){
          res.json({status:"error",message:"user not found"})
          return;
        }

        // If password_hash is null, it means they registered via Clerk.
        if (!user_exist.password_hash) {
          res.status(400).json({status:"error",message:"Please log in using your Google/Clerk account."})
          return;
        }

        const password_match=await bcrypt.compare(password,user_exist.password_hash);
        if(!password_match){
          res.json({status:"error",message:"invalid password"})
          return;
        }

        // 1. Generate the Access JWT token (Short lived)
        const accessToken = jwt.sign(
          { id: user_exist.id, name: user_exist.name, email: user_exist.email }, 
          process.env.JWT_SECRET!, 
          { expiresIn: "15m" }
        );

        // 2. Generate the Refresh Token (Long lived)
        const refreshToken = jwt.sign(
          { id: user_exist.id },
          process.env.JWT_SECRET!,
          { expiresIn: "7d" }
        );

        // 3. Store the refresh token in the database
        await userModel.updateRefreshToken(user_exist.id, refreshToken);

        // 4. Set both tokens in HTTP-Only Cookies
        res.cookie("accessToken", accessToken, {
          httpOnly: true, 
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict", 
          maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // 5. Send ONE JSON response
        res.status(200).json({
          status: "success", 
          message: "Logged in successfully",
          data: {
            id: user_exist.id,
            email: user_exist.email,
            name: user_exist.name
          }
        });
    }
    catch(err){
      console.error(err);
      res.status(500).json({status: "error", message: "internal server error"})
    }
}
 
export const getUser = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const user_data = req.user;

        if (!user_data) {
          res.status(404).json({ status: "error", message: "User not found" });
          return;
        }

        // Changed status from "done" to "success" to match the rest of our app
        res.status(200).json({ status: "success", data: user_data });
    }
    catch(err) {
        console.error("Get user error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
}

export const logout=async(req:Request,res:Response)=>{
  try{
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.status(200).json({status:"success",message:"Logged out successfully"})
  }
  catch(err){
    console.error("Logout err", err);
    res.status(500).json({status:"error",message:"internal server error"})
  }
}

export const clerkSync = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clerkId, email, name } = req.body;

    if (!clerkId || !email) {
      res.status(400).json({ status: "error", message: "Clerk ID and Email are required" });
      return;
    }

    // 1. Check if user already exists based on Clerk ID
    let user = await userModel.findByClerkId(clerkId);

    // 2. If not found by Clerk ID, check if they exist by email.
    if (!user) {
      user = await userModel.findByEmail(email);

      if (user) {
        //a user exist be email but not by clerk so now we add their clerk id
        await userModel.updateClerkId(user.id, clerkId);
        user.clerk_id = clerkId;
      } else {
        // not exist by email or even by clerk so new user created
        user = await userModel.createFromClerk(clerkId, email, name || "Clerk User");
      }
    }

    // 3. Generate JWT tokens for our backend session
    const accessToken = jwt.sign(
      { id: user.id, name: user.name, email: user.email }, 
      process.env.JWT_SECRET!, 
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    await userModel.updateRefreshToken(user.id, refreshToken);

    res.cookie("accessToken", accessToken, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", 
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

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
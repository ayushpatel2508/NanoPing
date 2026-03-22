import type { Response } from "express";
import bcrypt from "bcryptjs";
import { userModel } from "../models/userModel.js";
import type { CustomRequest } from "../middlewares/isLoggedIn.js";

// PUT /api/users/profile
export const updateProfile = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    if (!name || name.length < 2) {
      res.status(400).json({ status: "error", message: "Name must be at least 2 characters long" });
      return;
    }

    const updatedUser = await userModel.updateName(userId, name);
    res.status(200).json({ status: "success", data: updatedUser });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// POST /api/users/change-password
export const changePassword = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({ status: "error", message: "Passwords must be at least 8 characters long" });
      return;
    }

    const user = await userModel.findByEmail(email);
    if (!user || !user.password_hash) {
      res.status(400).json({ status: "error", message: "Cannot change password for this account. (Did you sign in with Google?)" });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ status: "error", message: "Current password is incorrect" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await userModel.updatePassword(userId, newHash);
    res.status(200).json({ status: "success", message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// DELETE /api/users/account
export const deleteAccount = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    // Only require password confirmation if they have a manual password account
    if (user.password_hash) {
      if (!password) {
        res.status(400).json({ status: "error", message: "Password is required to delete account" });
        return;
      }
      
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        res.status(401).json({ status: "error", message: "Incorrect password" });
        return;
      }
    }

    await userModel.deleteUser(userId);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ status: "success", message: "Account deleted permanently" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

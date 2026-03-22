import express from "express";
import { register, login, getUser, logout, clerkSync } from "../controllers/authController.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", isLoggedIn, getUser);
router.post("/logout", logout);
router.post("/clerk-sync", clerkSync);

export default router;

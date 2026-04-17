import express from "express";
import { register, login, getUser, logout } from "../controllers/authController.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Strict rate limit on credential endpoints (5 req/15min, skips successful requests)
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);


// These require valid tokens, so global limiter is sufficient
router.get("/me", isLoggedIn, getUser);
router.post("/logout", logout);

export default router;

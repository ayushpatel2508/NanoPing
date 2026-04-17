import express from "express";
import { updateProfile, changePassword, deleteAccount } from "../controllers/userController.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";
import { writeLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.use(isLoggedIn);

// All user routes are write operations — rate limited (20 req/min)
router.put("/profile", writeLimiter, updateProfile);
router.post("/change-password", writeLimiter, changePassword);
router.delete("/account", writeLimiter, deleteAccount);

export default router;

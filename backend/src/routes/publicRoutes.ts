import { Router } from "express";
import { getPublicStatus } from "../controllers/publicController.js";
import { publicLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// Fully unauthenticated route — tighter rate limit (30 req/min)
router.get("/status/:userId", publicLimiter, getPublicStatus);

export default router;

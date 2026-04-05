import { Router } from "express";
import { getPublicStatus } from "../controllers/publicController.js";

const router = Router();

// Fully unauthenticated route
router.get("/status/:userId", getPublicStatus);

export default router;

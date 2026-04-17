import express from "express";
import { createMonitor, getMonitors, getMonitorById, updateMonitor, toggleMonitorStatus, deleteMonitor } from "../controllers/monitorController.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";
import { writeLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// All monitor routes strictly require the user to be logged in
router.use(isLoggedIn);

// Read endpoints — global limiter is sufficient
router.get("/", getMonitors);
router.get("/:id", getMonitorById);

// Write endpoints — stricter rate limit (20 req/min)
router.post("/", writeLimiter, createMonitor);
router.put("/:id", writeLimiter, updateMonitor);
router.patch("/:id/status", writeLimiter, toggleMonitorStatus);
router.delete("/:id", writeLimiter, deleteMonitor);

export default router;

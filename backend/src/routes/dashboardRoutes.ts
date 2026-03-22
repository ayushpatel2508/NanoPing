import { Router } from "express";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";
import { getSummary, getRecentChecks, getMonitorStats, getIncidents } from "../controllers/dashboardController.js";

const router = Router();

// All dashboard routes require a valid login
router.use(isLoggedIn);

// Summary card for the main dashboard page
router.get("/summary", getSummary);

// Render-style realtime check logs for a specific monitor
router.get("/:id/checks", getRecentChecks);

// 30-day uptime graph data for the charts
router.get("/:id/stats", getMonitorStats);

// Incident history list
router.get("/:id/incidents", getIncidents);

export default router;

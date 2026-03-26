import { Router } from "express";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";
import { getSummary, getRecentChecks, getMonitorStats, getIncidents, getGlobalChecks, getGlobalStats, getGlobalIncidents } from "../controllers/dashboardController.js";

const router = Router();

// All dashboard routes require a valid login
router.use(isLoggedIn);

// Summary card for the main dashboard page
router.get("/summary", getSummary);

// --- Global endpoints ---

// Global realtime check logs across monitors
router.get("/global-checks", getGlobalChecks);

// Global 30-day stats across monitors
router.get("/global-stats", getGlobalStats);

// Global incident history across monitors
router.get("/global-incidents", getGlobalIncidents);

// --- Per-monitor endpoints ---

// Render-style realtime check logs for a specific monitor
router.get("/:id/checks", getRecentChecks);

// 30-day uptime graph data for the charts
router.get("/:id/stats", getMonitorStats);

// Incident history list
router.get("/:id/incidents", getIncidents);

export default router;

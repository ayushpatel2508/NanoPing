import express from "express";
import { createMonitor, getMonitors, getMonitorById, updateMonitor, toggleMonitorStatus, deleteMonitor } from "../controllers/monitorController.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";

const router = express.Router();

// All monitor routes strictly require the user to be logged in
router.use(isLoggedIn);

router.post("/", createMonitor);
router.get("/", getMonitors);
router.get("/:id", getMonitorById);
router.put("/:id", updateMonitor);
router.patch("/:id/status", toggleMonitorStatus);
router.delete("/:id", deleteMonitor);

export default router;

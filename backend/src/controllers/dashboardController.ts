import type { Request, Response } from "express";
import { dashboardModel } from "../models/dashboardModel.js";
import type { CustomRequest } from "../middlewares/isLoggedIn.js";

    // GET /api/dashboard/summary
    export const getSummary = async (req: Request, res: Response) => {
        try {
            const userId = String((req as CustomRequest).user?.id);
            const summary = await dashboardModel.getSummary(userId);
            res.json({ success: true, data: summary });
        } catch (error) {
            console.error("[Dashboard] getSummary error:", error);
            res.status(500).json({ success: false, message: "Failed to fetch dashboard summary." });
        }
    }

    // GET /api/dashboard/:id/checks?limit=50
    export const getRecentChecks = async (req: Request, res: Response) => {
        try {
            const userId = String((req as CustomRequest).user?.id);
            const id = String(req.params.id);
            const limit = Math.min(parseInt(String(req.query.limit || "")) || 50, 200);

            const checks = await dashboardModel.getRecentChecks(id, userId, limit);
            if (checks === null) {
                return res.status(404).json({ success: false, message: "Monitor not found." });
            }
            res.json({ success: true, data: checks });
        } catch (error) {
            console.error("[Dashboard] getRecentChecks error:", error);
            res.status(500).json({ success: false, message: "Failed to fetch check logs." });
        }
    }

    // GET /api/dashboard/:id/stats?days=30
    export const getMonitorStats = async (req: Request, res: Response) => {
        try {
            const userId = String((req as CustomRequest).user?.id);
            const id = String(req.params.id);
            const days = Math.min(parseInt(String(req.query.days || "")) || 30, 90);

            const stats = await dashboardModel.getMonitorStats(id, userId, days);
            if (stats === null) {
                return res.status(404).json({ success: false, message: "Monitor not found." });
            }
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error("[Dashboard] getMonitorStats error:", error);
            res.status(500).json({ success: false, message: "Failed to fetch stats." });
        }
    }

    // GET /api/dashboard/:id/incidents?limit=20
    export const getIncidents = async (req: Request, res: Response) => {
        try {
            const userId = String((req as CustomRequest).user?.id);
            const id = String(req.params.id);
            const limit = Math.min(parseInt(String(req.query.limit || "")) || 20, 100);

            const incidents = await dashboardModel.getIncidents(id, userId, limit);
            if (incidents === null) {
                return res.status(404).json({ success: false, message: "Monitor not found." });
            }
            res.json({ success: true, data: incidents });
        } catch (error) {
            console.error("[Dashboard] getIncidents error:", error);
            res.status(500).json({ success: false, message: "Failed to fetch incidents." });
        }
    }

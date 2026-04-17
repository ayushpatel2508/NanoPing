import type { Request, Response } from "express";
import { dashboardModel } from "../models/dashboardModel.js";
import type { CustomRequest } from "../middlewares/isLoggedIn.js";



const encodeCursor = (checked_at: string, id: string): string => {
    return Buffer.from(JSON.stringify({ checked_at, id })).toString('base64url');
};

const decodeCursor = (token: string): { checked_at: string; id: string } | null => {
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
        if (decoded.checked_at && decoded.id !== undefined) return decoded;
        return null;
    } catch {
        return null;
    }
};

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

    // GET /api/dashboard/:id/checks?limit=50&cursor=<token>
    export const getRecentChecks = async (req: Request, res: Response) => {
        try {
            const userId = String((req as CustomRequest).user?.id);
            const id = String(req.params.id);
            const limit = Math.min(parseInt(String(req.query.limit || "")) || 50, 2000);

            // Decode the opaque cursor token if provided
            const cursorToken = req.query.cursor as string | undefined;
            const cursor = cursorToken ? decodeCursor(cursorToken) : undefined;

            if (cursorToken && !cursor) {
                return res.status(400).json({ success: false, message: "Invalid cursor token." });
            }

            const result = await dashboardModel.getRecentChecks(id, userId, limit, cursor || undefined);
            if (result === null) {
                return res.status(404).json({ success: false, message: "Monitor not found." });
            }

            // Build the next cursor from the last row
            const lastRow = result.checks[result.checks.length - 1];
            const nextCursor = result.hasMore && lastRow
                ? encodeCursor(lastRow.checked_at, String(lastRow.id))
                : null;

            res.json({
                success: true,
                data: result.checks,
                nextCursor,
                hasMore: result.hasMore
            });
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



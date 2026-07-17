import type { Request, Response } from "express";
import { dashboardModel } from "../models/dashboardModel.js";
import type { CustomRequest } from "../middlewares/isLoggedIn.js";
import redisConnection from "../config/redis.js";



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

// GET /api/dashboard/global-checks?limit=20&cursor=<token>
export const getGlobalChecks = async (req: Request, res: Response) => {
    try {
        const userId = String((req as CustomRequest).user?.id);
        const limit = Math.min(parseInt(String(req.query.limit || "")) || 20, 100);

        // Support cursor-based pagination for global checks too
        const cursorToken = req.query.cursor as string | undefined;
        const cursor = cursorToken ? decodeCursor(cursorToken) : undefined;

        if (cursorToken && !cursor) {
            return res.status(400).json({ success: false, message: "Invalid cursor token." });
        }

        // --- REDIS CACHING: Only cache the very first page (no cursor) ---
        const cacheKey = `user:${userId}:global_checks_limit_${limit}`;
        if (!cursor) {
            try {
                const cachedData = await redisConnection.get(cacheKey);
                if (cachedData) {
                    res.setHeader('X-Cache', 'HIT');
                    return res.json(JSON.parse(cachedData));
                }
            } catch (err) {
                console.warn(`[Redis] Failed to get cache for ${cacheKey}`, err);
            }
        }

        const result = await dashboardModel.getGlobalRecentChecks(userId, limit, cursor || undefined);

        // Build the next cursor from the last row
        const lastRow = result.checks[result.checks.length - 1];
        const nextCursor = result.hasMore && lastRow
            ? encodeCursor(lastRow.checked_at, String(lastRow.id))
            : null;

        const responseData = {
            success: true,
            data: result.checks,
            nextCursor,
            hasMore: result.hasMore,
            limit
        };

        // Save to Redis for 15 seconds (so dashboards update quickly but db is protected)
        if (!cursor) {
            try {
                await redisConnection.setex(cacheKey, 15, JSON.stringify(responseData));
            } catch (err) {
                console.warn(`[Redis] Failed to set cache for ${cacheKey}`, err);
            }
        }

        res.setHeader('X-Cache', 'MISS');
        res.json(responseData);
    } catch (error) {
        console.error("[Dashboard] getGlobalChecks error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch global check logs." });
    }
}

// GET /api/dashboard/global-stats?days=30
export const getGlobalStats = async (req: Request, res: Response) => {
    try {
        const userId = String((req as CustomRequest).user?.id);
        const days = Math.min(parseInt(String(req.query.days || "")) || 30, 90);

        const stats = await dashboardModel.getGlobalStats(userId, days);
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error("[Dashboard] getGlobalStats error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch global stats." });
    }
}

// GET /api/dashboard/global-incidents?limit=20
export const getGlobalIncidents = async (req: Request, res: Response) => {
    try {
        const userId = String((req as CustomRequest).user?.id);
        const limit = Math.min(parseInt(String(req.query.limit || "")) || 20, 100);

        const incidents = await dashboardModel.getGlobalIncidents(userId, limit);
        res.json({ success: true, data: incidents });
    } catch (error) {
        console.error("[Dashboard] getGlobalIncidents error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch global incidents." });
    }
}

// GET /api/dashboard/all-monitor-stats?days=30
export const getAllMonitorStats = async (req: Request, res: Response) => {
    try {
        const userId = String((req as CustomRequest).user?.id);
        const days = Math.min(parseInt(String(req.query.days || "")) || 30, 90);

        const stats = await dashboardModel.getAllMonitorStats(userId, days);
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error("[Dashboard] getAllMonitorStats error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch all monitor stats." });
    }
}

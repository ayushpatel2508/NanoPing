import type { Response } from "express";
import { monitorModel } from "../models/monitorModel.js";
import type { CustomRequest } from "../middlewares/isLoggedIn.js";
import redisConnection from "../config/redis.js";
import pool from "../config/db.js";
import { isValidUrl } from "../utils/validation.js";

const invalidateUserCache = async (userId: string | number) => {
  try {
    await redisConnection.del(`user:${userId}:monitors_cache`);
  } catch (err) {
    console.warn(`[Redis] Non-fatal error: Failed to clear cache for user ${userId}`, err);
  }
};


// POST /api/monitors
export const createMonitor = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    const MAX_MONITORS_PER_USER = 50;
    const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM monitors WHERE user_id = $1', [userId]);
    if (countResult.rows[0].count >= MAX_MONITORS_PER_USER) {
      res.status(403).json({ status: "error", message: `Monitor limit reached. Maximum ${MAX_MONITORS_PER_USER} monitors allowed per account.` });
      return;
    }

    const { name, url, check_interval = 3, alert_threshold = 3 } = req.body;

    if (!name || name.length < 1 || name.length > 100) {
      res.status(400).json({ status: "error", message: "Name must be between 1 and 100 characters" });
      return;
    }

    if (!url || !isValidUrl(url)) {
      res.status(400).json({ status: "error", message: "Valid HTTP or HTTPS URL is required" });
      return;
    }

    if (check_interval < 1 || check_interval > 60) {
      res.status(400).json({ status: "error", message: "Check interval must be between 1 and 60 minutes" });
      return;
    }

    if (alert_threshold < 1 || alert_threshold > 10) {
      res.status(400).json({ status: "error", message: "Alert threshold must be between 1 and 10" });
      return;
    }

    const monitor = await monitorModel.create(userId, name, url, check_interval, alert_threshold);
    
    // Invalidate dashboard cache safely
    await invalidateUserCache(userId);

    res.status(201).json({ status: "success", data: monitor });
  } catch (err) {
    console.error("Create monitor error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// GET /api/monitors
export const getMonitors = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 20;
    if (limit > 100) limit = 100; // max limit
    const offset = (page - 1) * limit;

    const status = (req.query.status as string)?.toLowerCase();

    // 1. Check Redis Cache strictly for the default dashboard payload (prevents cache bloating)
    const isDefaultRequest = page === 1 && limit === 20 && !status;
    const cacheKey = `user:${userId}:monitors_cache`;

    if (isDefaultRequest) {
      const cachedData = await redisConnection.get(cacheKey);
      if (cachedData) {
        // Cache HIT: Send response instantly without touching DB
        res.status(200).json(JSON.parse(cachedData));
        return;
      }
    }

    // 2. Cache MISS: Query the database
    const { monitors, total } = await monitorModel.getAllForUser(userId, limit, offset, status);

    const responseData = {
      status: "success",
      data: {
        monitors,
        pagination: { page, limit, total }
      }
    };

    // 3. Save to Redis with 24-hr expiry
    if (isDefaultRequest) {
      await redisConnection.setex(cacheKey, 86400, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
  } catch (err) {
    console.error("Get monitors error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// GET /api/monitors/:id
export const getMonitorById = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    if (!id) {
       res.status(400).json({ status: "error", message: "Monitor ID is required" });
       return;
    }

    const monitor = await monitorModel.getByIdForUser(id as string, userId);
    if (!monitor) {
      res.status(404).json({ status: "error", message: "Monitor not found" });
      return;
    }

    res.status(200).json({ status: "success", data: monitor });
  } catch (err) {
    console.error("Get monitor by id error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// PUT /api/monitors/:id
export const updateMonitor = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { check_interval, alert_threshold } = req.body;

    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    if (check_interval !== undefined && (check_interval < 1 || check_interval > 60)) {
       res.status(400).json({ status: "error", message: "Check interval must be between 1 and 60 minutes" });
       return;
    }

    if (alert_threshold !== undefined && (alert_threshold < 1 || alert_threshold > 10)) {
       res.status(400).json({ status: "error", message: "Alert threshold must be between 1 and 10" });
       return;
    }

    if (!id) {
       res.status(400).json({ status: "error", message: "Monitor ID is required" });
       return;
    }

    const updatedMonitor = await monitorModel.update(id as string, userId, check_interval, alert_threshold);
    if (!updatedMonitor) {
      res.status(404).json({ status: "error", message: "Monitor not found or nothing to update" });
      return;
    }

    // Invalidate dashboard cache safely
    await invalidateUserCache(userId);

    res.status(200).json({ status: "success", data: updatedMonitor });
  } catch (err) {
    console.error("Update monitor error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// PATCH /api/monitors/:id/status
export const toggleMonitorStatus = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { is_active } = req.body;

    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    if (typeof is_active !== 'boolean') {
      res.status(400).json({ status: "error", message: "is_active must be a boolean" });
      return;
    }

    if (!id) {
       res.status(400).json({ status: "error", message: "Monitor ID is required" });
       return;
    }

    const updatedMonitor = await monitorModel.updateStatus(id as string, userId, is_active);
    if (!updatedMonitor) {
      res.status(404).json({ status: "error", message: "Monitor not found" });
      return;
    }

    // Invalidate dashboard cache safely
    await invalidateUserCache(userId);

    res.status(200).json({ 
      status: "success", 
      message: is_active ? "Monitor resumed" : "Monitor paused",
      data: updatedMonitor
    });
  } catch (err) {
    console.error("Toggle monitor status error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// DELETE /api/monitors/:id
export const deleteMonitor = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    if (!id) {
       res.status(400).json({ status: "error", message: "Monitor ID is required" });
       return;
    }

    const success = await monitorModel.delete(id as string, userId);
    if (!success) {
      res.status(404).json({ status: "error", message: "Monitor not found" });
      return;
    }

    // Invalidate dashboard cache safely
    await invalidateUserCache(userId);

    res.status(200).json({ status: "success", message: "Monitor deleted" });
  } catch (err) {
    console.error("Delete monitor error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

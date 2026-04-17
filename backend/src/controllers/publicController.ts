import type { Request, Response } from "express";
import pool from "../config/db.js";

// Helper for masking URLs down to hostname
const extractHostname = (urlString: string) => {
  try {
    return new URL(urlString).hostname;
  } catch (e) {
    return urlString; // Fallback if somehow invalid
  }
};

// UUID v4 validation regex
const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// GET /api/public/status/:userId
export const getPublicStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;

    if (!userId || !isValidUUID(userId)) {
       res.status(400).json({ status: "error", message: "Invalid or missing User ID" });
       return;
    }

    // 1. Get the User's Company / Name
    const userResult = await pool.query("SELECT name FROM users WHERE id = $1", [userId]);
    
    if (userResult.rowCount === 0) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    const companyName = userResult.rows[0].name;

    // 2. Get their Active Monitors (Safe columns only)
    const monitorsResult = await pool.query(`
        SELECT id, name, url, last_status, last_checked 
        FROM monitors 
        WHERE user_id = $1 AND is_active = true
        ORDER BY name ASC
    `, [userId]);

    const safeMonitors = monitorsResult.rows.map((monitor) => ({
        id: monitor.id,
        name: monitor.name,
        target: extractHostname(monitor.url),
        status: monitor.last_status,
        last_checked: monitor.last_checked
    }));

    // We can also fetch 30-day uptime per monitor if needed, but for MVP it's lightweight.

    res.status(200).json({
        status: "success",
        data: {
            companyName,
            monitors: safeMonitors
        }
    });

  } catch (error) {
    console.error("Public Status endpoint error:", error);
    res.status(500).json({ status: "error", message: "Failed to load public status" });
  }
};

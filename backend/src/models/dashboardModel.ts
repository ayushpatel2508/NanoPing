import pool from "../config/db.js";

export const dashboardModel = {

    // 1. GET /api/dashboard/summary — The top cards on the main dashboard
    getSummary: async (userId: string) => {
        const result = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE is_active = true) AS total_monitors,
                COUNT(*) FILTER (WHERE last_status = 'up' AND is_active = true) AS monitors_up,
                COUNT(*) FILTER (WHERE last_status = 'down' AND is_active = true) AS monitors_down,
                COUNT(*) FILTER (WHERE last_status IS NULL AND is_active = true) AS monitors_pending
            FROM monitors
            WHERE user_id = $1
        `, [userId]);
        return result.rows[0];
    },

    // 2. GET /api/monitors/:id/checks — Cursor-paginated ping logs
    getRecentChecks: async (monitorId: string, userId: string, limit: number = 50, cursor?: { checked_at: string; id: string }) => {
        // First verify the user owns this monitor
        const ownerCheck = await pool.query(
            "SELECT id FROM monitors WHERE id = $1 AND user_id = $2",
            [monitorId, userId]
        );
        if (ownerCheck.rowCount === 0) return null;

        // Cursor-based: fetch rows OLDER than the cursor point
        let query: string;
        let params: any[];

        if (cursor) {
            // Composite keyset: (checked_at, id) < (cursor_checked_at, cursor_id)
            query = `
                SELECT id, status, status_code, response_time, checked_at
                FROM checks
                WHERE monitor_id = $1
                  AND (checked_at, id) < ($2, $3)
                ORDER BY checked_at DESC, id DESC
                LIMIT $4
            `;
            params = [monitorId, cursor.checked_at, cursor.id, limit + 1];
        } else {
            query = `
                SELECT id, status, status_code, response_time, checked_at
                FROM checks
                WHERE monitor_id = $1
                ORDER BY checked_at DESC, id DESC
                LIMIT $2
            `;
            params = [monitorId, limit + 1];
        }

        const result = await pool.query(query, params);

        // We fetched limit+1 to check if there's a next page
        const hasMore = result.rows.length > limit;
        const checks = hasMore ? result.rows.slice(0, limit) : result.rows;

        return { checks, hasMore };
    },

    // 3. GET /api/monitors/:id/stats — 30-day uptime graph data
    getMonitorStats: async (monitorId: string, userId: string, days: number = 30) => {
        const ownerCheck = await pool.query(
            "SELECT id FROM monitors WHERE id = $1 AND user_id = $2",
            [monitorId, userId]
        );
        if (ownerCheck.rowCount === 0) return null;

        const result = await pool.query(`
            SELECT day, uptime_percentage, avg_response_time, total_checks
            FROM monitor_stats
            WHERE monitor_id = $1
              AND day >= CURRENT_DATE - ($2 || ' days')::INTERVAL
            ORDER BY day ASC
        `, [monitorId, days]);
        return result.rows;
    },

    // 4. GET /api/monitors/:id/incidents — Incident history
    getIncidents: async (monitorId: string, userId: string, limit: number = 20) => {
        const ownerCheck = await pool.query(
            "SELECT id FROM monitors WHERE id = $1 AND user_id = $2",
            [monitorId, userId]
        );
        if (ownerCheck.rowCount === 0) return null;

        const result = await pool.query(`
            SELECT 
                id,
                started_at,
                resolved_at,
                is_resolved,
                alert_status,
                CASE 
                    WHEN resolved_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (resolved_at - started_at))::INT
                    ELSE EXTRACT(EPOCH FROM (NOW() - started_at))::INT
                END AS duration_seconds
            FROM incidents
            WHERE monitor_id = $1
            ORDER BY started_at DESC
            LIMIT $2
        `, [monitorId, limit]);
        return result.rows;
    },


};

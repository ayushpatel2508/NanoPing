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

    // 5. GET /api/dashboard/global-checks — Global recent checks (cursor-paginated)
    getGlobalRecentChecks: async (userId: string, limit: number = 20, cursor?: { checked_at: string; id: string }) => {
        let query: string;
        let params: any[];

        if (cursor) {
            query = `
                SELECT c.id, c.status, c.status_code, c.response_time, c.checked_at, c.monitor_id, c.message, m.name as monitor_name
                FROM checks c
                JOIN monitors m ON c.monitor_id = m.id
                WHERE m.user_id = $1
                  AND (c.checked_at, c.id) < ($2, $3)
                ORDER BY c.checked_at DESC, c.id DESC
                LIMIT $4
            `;
            params = [userId, cursor.checked_at, cursor.id, limit + 1];
        } else {
            query = `
                SELECT c.id, c.status, c.status_code, c.response_time, c.checked_at, c.monitor_id, c.message, m.name as monitor_name
                FROM checks c
                JOIN monitors m ON c.monitor_id = m.id
                WHERE m.user_id = $1
                ORDER BY c.checked_at DESC, c.id DESC
                LIMIT $2
            `;
            params = [userId, limit + 1];
        }

        const result = await pool.query(query, params);

        const hasMore = result.rows.length > limit;
        const checks = hasMore ? result.rows.slice(0, limit) : result.rows;

        return { checks, hasMore };
    },

    // 6. GET /api/dashboard/global-stats — Global stats aggregated across all monitors
    getGlobalStats: async (userId: string, days: number = 30) => {
        const result = await pool.query(`
            SELECT ms.day, 
                   AVG(ms.uptime_percentage) as avg_uptime_percentage, 
                   AVG(ms.avg_response_time) as avg_response_time, 
                   SUM(ms.total_checks) as total_checks
            FROM monitor_stats ms
            JOIN monitors m ON ms.monitor_id = m.id
            WHERE m.user_id = $1
              AND ms.day >= CURRENT_DATE - ($2 || ' days')::INTERVAL
            GROUP BY ms.day
            ORDER BY ms.day ASC
        `, [userId, days]);
        return result.rows;
    },

    // 7. GET /api/dashboard/global-incidents — All incidents across all monitors
    getGlobalIncidents: async (userId: string, limit: number = 20) => {
        const result = await pool.query(`
            SELECT 
                i.id,
                i.monitor_id,
                m.name as monitor_name,
                i.started_at,
                i.resolved_at,
                i.is_resolved,
                i.alert_status,
                CASE 
                    WHEN i.resolved_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (i.resolved_at - i.started_at))::INT
                    ELSE EXTRACT(EPOCH FROM (NOW() - i.started_at))::INT
                END AS duration_seconds
            FROM incidents i
            JOIN monitors m ON i.monitor_id = m.id
            WHERE m.user_id = $1
            ORDER BY i.started_at DESC
            LIMIT $2
        `, [userId, limit]);
        return result.rows;
    },

    // 8. GET /api/dashboard/all-monitor-stats — Per-monitor daily stats (not aggregated)
    getAllMonitorStats: async (userId: string, days: number = 30) => {
        const result = await pool.query(`
            SELECT ms.monitor_id, ms.day, ms.uptime_percentage, ms.avg_response_time, ms.total_checks
            FROM monitor_stats ms
            JOIN monitors m ON ms.monitor_id = m.id
            WHERE m.user_id = $1
              AND ms.day >= CURRENT_DATE - ($2 || ' days')::INTERVAL
            ORDER BY ms.monitor_id, ms.day ASC
        `, [userId, days]);
        return result.rows;
    }
};

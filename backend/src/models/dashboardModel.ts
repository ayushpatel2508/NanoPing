import prisma from "../config/prisma.js";

// Mapping helpers to ensure frontend compatibility
const mapCheck = (c: any) => ({
    id: c.id.toString(), // Convert BigInt to string
    status: c.status,
    status_code: c.statusCode,
    response_time: c.responseTime,
    checked_at: c.checkedAt,
    monitor_id: c.monitorId,
    message: c.message,
    monitor_name: c.monitor?.name // Optional join
});

const mapIncident = (i: any) => {
    const started = new Date(i.startedAt);
    const end = i.resolvedAt ? new Date(i.resolvedAt) : new Date();
    const duration_seconds = Math.floor((end.getTime() - started.getTime()) / 1000);

    return {
        id: i.id,
        monitor_id: i.monitorId,
        monitor_name: i.monitor?.name,
        started_at: i.startedAt,
        resolved_at: i.resolvedAt,
        is_resolved: i.isResolved,
        alert_status: i.alertStatus,
        duration_seconds
    };
};

export const dashboardModel = {

    // 1. GET /api/dashboard/summary — The top cards on the main dashboard
    getSummary: async (userId: string) => {
        const [total, up, down, pending] = await Promise.all([
            prisma.monitor.count({ where: { userId, isActive: true } }),
            prisma.monitor.count({ where: { userId, isActive: true, lastStatus: 'up' } }),
            prisma.monitor.count({ where: { userId, isActive: true, lastStatus: 'down' } }),
            prisma.monitor.count({ where: { userId, isActive: true, lastStatus: null } }),
        ]);

        return {
            total_monitors: total.toString(),
            monitors_up: up.toString(),
            monitors_down: down.toString(),
            monitors_pending: pending.toString()
        };
    },

    // 2. GET /api/monitors/:id/checks — Cursor-paginated ping logs
    getRecentChecks: async (monitorId: string, userId: string, limit: number = 50, cursor?: { checked_at: string; id: string }) => {
        // Verify ownership
        const monitor = await prisma.monitor.findFirst({
            where: { id: monitorId, userId },
            select: { id: true }
        });
        if (!monitor) return null;

        // Use findMany with keyset pagination
        // Prisma doesn't support tuple (checkedAt, id) comparison yet, 
        // so we use a standard cursor if id is unique and roughly chronological, 
        // OR we use raw SQL for the specific keyset optimization.
        // For precision, we'll use raw SQL for the keyset cursor logic but return Prisma types.
        
        let checks: any[];
        if (cursor) {
            checks = await prisma.$queryRaw`
                SELECT id, status, status_code as "statusCode", response_time as "responseTime", checked_at as "checkedAt"
                FROM checks
                WHERE monitor_id = ${monitorId}::uuid
                  AND (checked_at, id) < (${cursor.checked_at}::timestamp, ${BigInt(cursor.id)})
                ORDER BY checked_at DESC, id DESC
                LIMIT ${limit + 1}
            `;
        } else {
            checks = await prisma.$queryRaw`
                SELECT id, status, status_code as "statusCode", response_time as "responseTime", checked_at as "checkedAt"
                FROM checks
                WHERE monitor_id = ${monitorId}::uuid
                ORDER BY checked_at DESC, id DESC
                LIMIT ${limit + 1}
            `;
        }

        const hasMore = checks.length > limit;
        const data = hasMore ? checks.slice(0, limit) : checks;

        return { 
            checks: data.map(mapCheck), 
            hasMore 
        };
    },

    // 3. GET /api/monitors/:id/stats — 30-day uptime graph data
    getMonitorStats: async (monitorId: string, userId: string, days: number = 30) => {
        const monitor = await prisma.monitor.findFirst({
            where: { id: monitorId, userId },
            select: { id: true }
        });
        if (!monitor) return null;

        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - days);

        const stats = await prisma.monitorStats.findMany({
            where: {
                monitorId,
                day: { gte: thresholdDate }
            },
            orderBy: { day: 'asc' }
        });

        return stats.map((s: any) => ({
            day: s.day,
            uptime_percentage: s.uptimePercentage ? Number(s.uptimePercentage) : null,
            avg_response_time: s.avgResponseTime,
            total_checks: s.totalChecks
        }));
    },

    // 4. GET /api/monitors/:id/incidents — Incident history
    getIncidents: async (monitorId: string, userId: string, limit: number = 20) => {
        const monitor = await prisma.monitor.findFirst({
            where: { id: monitorId, userId },
            select: { id: true }
        });
        if (!monitor) return null;

        const incidents = await prisma.incident.findMany({
            where: { monitorId },
            take: limit,
            orderBy: { startedAt: 'desc' }
        });

        return incidents.map(mapIncident);
    },

    // 5. GET /api/dashboard/global-checks — Global recent checks (cursor-paginated)
    getGlobalRecentChecks: async (userId: string, limit: number = 20, cursor?: { checked_at: string; id: string }) => {
        let checks: any[];
        
        // Complex join with keyset pagination is best handled via raw SQL in Prisma 
        // to maintain the exact (checked_at, id) cursor optimization.
        if (cursor) {
            checks = await prisma.$queryRaw`
                SELECT c.id, c.status, c.status_code as "statusCode", c.response_time as "responseTime", 
                       c.checked_at as "checkedAt", c.monitor_id as "monitorId", c.message, m.name as "monitorName"
                FROM checks c
                JOIN monitors m ON c.monitor_id = m.id
                WHERE m.user_id = ${userId}::uuid
                  AND (c.checked_at, c.id) < (${cursor.checked_at}::timestamp, ${BigInt(cursor.id)})
                ORDER BY c.checked_at DESC, c.id DESC
                LIMIT ${limit + 1}
            `;
        } else {
            checks = await prisma.$queryRaw`
                SELECT c.id, c.status, c.status_code as "statusCode", c.response_time as "responseTime", 
                       c.checked_at as "checkedAt", c.monitor_id as "monitorId", c.message, m.name as "monitorName"
                FROM checks c
                JOIN monitors m ON c.monitor_id = m.id
                WHERE m.user_id = ${userId}::uuid
                ORDER BY c.checked_at DESC, c.id DESC
                LIMIT ${limit + 1}
            `;
        }

        const hasMore = checks.length > limit;
        const data = hasMore ? checks.slice(0, limit) : checks;

        return { 
            checks: data.map(c => ({
                ...mapCheck(c),
                monitor_name: c.monitorName
            })), 
            hasMore 
        };
    },

    // 6. GET /api/dashboard/global-stats — Global stats aggregated across all monitors
    getGlobalStats: async (userId: string, days: number = 30) => {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - days);

        // Grouping across joins is best done with $queryRaw or a very detailed findMany
        const stats: any[] = await prisma.$queryRaw`
            SELECT ms.day, 
                   AVG(ms.uptime_percentage) as "avg_uptime_percentage", 
                   AVG(ms.avg_response_time) as "avg_response_time", 
                   SUM(ms.total_checks) as "total_checks"
            FROM monitor_stats ms
            JOIN monitors m ON ms.monitor_id = m.id
            WHERE m.user_id = ${userId}::uuid
              AND ms.day >= ${thresholdDate}
            GROUP BY ms.day
            ORDER BY ms.day ASC
        `;

        return stats.map(s => ({
            day: s.day,
            avg_uptime_percentage: s.avg_uptime_percentage ? Number(s.avg_uptime_percentage) : null,
            avg_response_time: s.avg_response_time ? Number(s.avg_response_time) : null,
            total_checks: s.total_checks ? Number(s.total_checks) : 0
        }));
    },

    // 7. GET /api/dashboard/global-incidents — All incidents across all monitors
    getGlobalIncidents: async (userId: string, limit: number = 20) => {
        const incidents = await prisma.incident.findMany({
            where: {
                monitor: { userId }
            },
            include: {
                monitor: { select: { name: true } }
            },
            take: limit,
            orderBy: { startedAt: 'desc' }
        });

        return incidents.map(mapIncident);
    },

    // 8. GET /api/dashboard/all-monitor-stats — Per-monitor daily stats (not aggregated)
    getAllMonitorStats: async (userId: string, days: number = 30) => {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - days);

        const stats = await prisma.monitorStats.findMany({
            where: {
                monitor: { userId },
                day: { gte: thresholdDate }
            },
            orderBy: [
                { monitorId: 'asc' },
                { day: 'asc' }
            ]
        });

        return stats.map((s: any) => ({
            monitor_id: s.monitorId,
            day: s.day,
            uptime_percentage: s.uptimePercentage ? Number(s.uptimePercentage) : null,
            avg_response_time: s.avgResponseTime,
            total_checks: s.totalChecks
        }));
    }
};


import pool from "../../config/db.js";

// Cron Job 1: Runs Every Night at Midnight
// Aggregates the last 24 hours of raw 'checks' data into one clean row in 'monitor_stats'
export const startNightlyAggregation = () => {
    const runAggregation = async () => {
        console.log("[NightlyJob] Starting daily aggregation of monitor stats...");
        try {
            // Calculate yesterday's stats for every active monitor in one SQL query
            await pool.query(`
                INSERT INTO monitor_stats (monitor_id, day, uptime_percentage, avg_response_time, total_checks)
                SELECT
                    monitor_id,
                    CURRENT_DATE - INTERVAL '1 day' AS day,
                    ROUND(
                        (COUNT(*) FILTER (WHERE status = 'up')::DECIMAL / COUNT(*)) * 100,
                        2
                    ) AS uptime_percentage,
                    AVG(response_time)::INT AS avg_response_time,
                    COUNT(*) AS total_checks
                FROM checks
                WHERE checked_at >= CURRENT_DATE - INTERVAL '1 day'
                  AND checked_at < CURRENT_DATE
                GROUP BY monitor_id
                ON CONFLICT (monitor_id, day) DO UPDATE
                    SET uptime_percentage = EXCLUDED.uptime_percentage,
                        avg_response_time = EXCLUDED.avg_response_time,
                        total_checks = EXCLUDED.total_checks;
            `);
            console.log("[NightlyJob] ✅ Daily stats successfully aggregated.");
        } catch (error) {
            console.error("[NightlyJob] ❌ Aggregation failed:", error);
        }
    };

    // Calculate milliseconds until next midnight
    const scheduleNextRun = () => {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0); // Next midnight
        const msUntilMidnight = midnight.getTime() - now.getTime();

        setTimeout(() => {
            runAggregation();
            // After the first run, repeat every 24 hours
            setInterval(runAggregation, 24 * 60 * 60 * 1000);
        }, msUntilMidnight);

        console.log(`[NightlyJob] Aggregation scheduled for midnight (in ${Math.round(msUntilMidnight / 60000)} mins).`);
    };

    scheduleNextRun();
};

// Cron Job 2: Runs Every Night, deletes checks older than 7 days
export const startDataPurge = () => {
    const runPurge = async () => {
        console.log("[PurgeJob] Starting data retention purge...");
        try {
            const result = await pool.query(`
                DELETE FROM checks WHERE checked_at < NOW() - INTERVAL '7 days'
            `);
            console.log(`[PurgeJob] ✅ Purged ${result.rowCount} old check records.`);
        } catch (error) {
            console.error("[PurgeJob] ❌ Purge failed:", error);
        }
    };

    // Run purge 1 hour after midnight (after aggregation is safely done)
    const scheduleNextRun = () => {
        const now = new Date();
        const oneAm = new Date();
        oneAm.setHours(25, 0, 0, 0); // 1:00 AM next day
        const msUntilOneAm = oneAm.getTime() - now.getTime();

        setTimeout(() => {
            runPurge();
            setInterval(runPurge, 24 * 60 * 60 * 1000);
        }, msUntilOneAm);

        console.log(`[PurgeJob] Data purge scheduled for 1:00 AM (in ${Math.round(msUntilOneAm / 60000)} mins).`);
    };

    scheduleNextRun();
};

import { pingQueue } from "./queues.js";
import pool  from "../../config/db.js";

// The Mastermind: Runs automatically every 60 seconds
export const startScheduler = () => {
    setInterval(async () => {
        try {
            // Ask PostgreSQL which websites are due for a check
            const result = await pool.query(`
                SELECT id, url, alert_threshold 
                FROM monitors 
                WHERE is_active = true 
                AND (last_checked IS NULL OR last_checked < NOW() - (check_interval * interval '1 minute'))
            `);

            // throw all of them into BullMQ
            for (const monitor of result.rows) {
                pingQueue.add("ping", { 
                    monitorId: monitor.id, 
                    url: monitor.url, 
                    alertThreshold: monitor.alert_threshold 
                }, {
                    removeOnComplete: true, // Auto-delete on success to save RAM
                    jobId: `ping-${monitor.id}` // STRICT ID: Prevents duplicate queuing!
                });
            }

            if ( result.rowCount && result.rowCount > 0) {
               console.log(`[Scheduler] Queued ${result.rowCount} websites for pinging.`);
            }
        } catch (error) {
            console.error("[Scheduler] Error querying PostgreSQL for active monitors:", error);
        }
    }, 60000); // 60,000 ms = 1 Minute

    console.log("[Scheduler] 1-Minute Cron Job strictly initialized.");
};

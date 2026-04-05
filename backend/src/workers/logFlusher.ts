import pool from "../config/db.js";
import redisConnection from "../config/redis.js";

/**
 * Periodically takes a batch of ping logs from the Redis buffer
 * and bulk inserts them into PostgreSQL to save database load.
 */
export const startLogFlusher = () => {
    setInterval(async () => {
        try {
            // 1. Atomically pop up to 1000 items from the queue
            // Note: lpop takes a count in recent versions of Redis
            const rawLogs = await redisConnection.lpop('ping_logs_buffer', 1000) as string[] | null;

            if (!rawLogs || rawLogs.length === 0) return;

            // 2. Parse logs
            const values: string[] = [];
            const queryParams: any[] = [];
            let i = 1;

            rawLogs.forEach((rawLog) => {
                try {
                    const log = JSON.parse(rawLog);
                    values.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
                    queryParams.push(
                        log.monitor_id, 
                        log.status, 
                        log.status_code, 
                        log.response_time, 
                        log.checked_at
                    );
                } catch (e) {
                    console.error("[LogFlusher] Error parsing log item:", e);
                }
            });

            if (values.length === 0) return;

            // 3. Construct Bulk Query
            const query = `
                INSERT INTO checks (monitor_id, status, status_code, response_time, checked_at)
                VALUES ${values.join(', ')}
            `;

            await pool.query(query, queryParams);
            console.log(`[LogFlusher] Bulk inserted ${values.length} logs into PostgreSQL.`);
            
        } catch (error) {
            console.error("[LogFlusher] Error pushing logs to database:", error);
        }
    }, 30000); // Every 30 seconds

    console.log("[LogFlusher] 30-Second Redis Bulk Insert job initialized.");
};

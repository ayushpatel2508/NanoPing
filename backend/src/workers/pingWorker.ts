import { Worker, type Job } from "bullmq";
import redisConnection from "../config/redis.js";
import  pool  from "../../config/db.js";
import { alertQueue } from "./queues.js";

// This worker listens to the "pings" Redis queue
export const pingWorker = new Worker("pings", async (job: Job) => {
  const { monitorId, url, alertThreshold } = job.data;
  const startTime = Date.now();
  let status = "down";
  let statusCode = null;

  try {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s strict timeout
     const response = await fetch(url, { signal: controller.signal });
     clearTimeout(timeoutId);

     statusCode = response.status;
     if (response.ok) {
        status = "up";
     }
  } catch (error: any) {
     // DNS failures, AbortController timeouts, or refused connections
  }

  const responseTime = Date.now() - startTime;

  // 1. Insert the raw ping log
  await pool.query(
    "INSERT INTO checks (monitor_id, status, status_code, response_time) VALUES ($1, $2, $3, $4)",
    [monitorId, status, statusCode, responseTime]
  );

  // 2. Safely Update the Monitor stats
  const monitorRow = await pool.query(`
    UPDATE monitors 
    SET last_status = $1, 
        last_checked = NOW(), 
        consecutive_failures = CASE WHEN $1 = 'down' THEN consecutive_failures + 1 ELSE 0 END 
    WHERE id = $2 
    RETURNING consecutive_failures
  `, [status, monitorId]);

  const consecutiveFailures = monitorRow.rows[0].consecutive_failures;

  // 3. CORE LOGIC: Does this trigger a new Alert?
  if (status === "down" && consecutiveFailures >= alertThreshold) {
      
      const incident = await pool.query("SELECT id FROM incidents WHERE monitor_id = $1 AND is_resolved = false", [monitorId]);
      
      let incidentId;
      if (incident.rowCount === 0) {
          const newIncident = await pool.query("INSERT INTO incidents (monitor_id) VALUES ($1) RETURNING id", [monitorId]);
          incidentId = newIncident.rows[0].id;
      } else {
          incidentId = incident.rows[0].id;
      }

      // Check the Database State Machine!
      const currentIncident = await pool.query("SELECT alert_status FROM incidents WHERE id = $1", [incidentId]);
      
      if (currentIncident.rows[0].alert_status === 'PENDING') {
         // Queue the email! strictly locks the ID
         await alertQueue.add(
             "send-down-alert", 
             { incidentId, monitorId, url }, 
             { jobId: `down-alert-${incidentId}`
         },
         
         );
      }

  } else if (status === "up") {
      // 4. CORE LOGIC: Does this RESOLVE an old Incident?
      const resolved = await pool.query(`
         UPDATE incidents 
         SET resolved_at = NOW(), is_resolved = true 
         WHERE monitor_id = $1 AND is_resolved = false 
         RETURNING id
      `, [monitorId]);

      if (resolved.rowCount && resolved.rowCount > 0) {
         await alertQueue.add(
             "send-up-alert", 
             { incidentId: resolved.rows[0].id, monitorId, url }, 
             { jobId: `up-alert-${resolved.rows[0].id}` }
         );
      }
  }

}, { 
  connection: redisConnection as any,
  concurrency: 5 // Reduced to protect PostgreSQL connection pool (max 20) and prevent IP bans
});

pingWorker.on("error", (err) => {
    console.error(`[PingWorker Critical Error]:`, err);
});

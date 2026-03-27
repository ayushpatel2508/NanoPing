import { Worker, type Job } from "bullmq";
import redisConnection from "../config/redis.js";
import pool from "../config/db.js";
import { alertQueue } from "./queues.js";
import { getIO } from "../config/socket.js";

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
  const checkedAt = new Date();

  // 1. Insert the raw ping log
  const checkResult = await pool.query(
    "INSERT INTO checks (monitor_id, status, status_code, response_time, checked_at) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [monitorId, status, statusCode, responseTime, checkedAt]
  );

  // Emit the new check to anyone listening to this monitor
  try {
    const io = getIO();
    io.to(`monitor-${monitorId}`).emit("check:new", {
      monitorId,
      status,
      status_code: statusCode,
      response_time: responseTime,
      checked_at: checkedAt
    });
  } catch (err) {
    // Socket not initialized yet or other error, ignore to prevent worker crash
  }

  // 2. Safely Update the Monitor stats
  const monitorRow = await pool.query(`
    UPDATE monitors 
    SET last_status = $1, 
        last_checked = $2, 
        consecutive_failures = CASE WHEN $1 = 'down' THEN consecutive_failures + 1 ELSE 0 END 
    WHERE id = $3 
    RETURNING consecutive_failures, last_status
  `, [status, checkedAt, monitorId]);

  const { consecutive_failures: consecutiveFailures, last_status: lastStatus } = monitorRow.rows[0];

  // Emit status update to the room (and potentially a global dashboard room if we add one)
  try {
    const io = getIO();
    io.to(`monitor-${monitorId}`).emit("monitor:status_update", {
      monitorId,
      last_status: lastStatus,
      consecutive_failures: consecutiveFailures
    });
    // Also emit to a general dashboard room if needed
    io.emit("monitor:status_update", {
        monitorId,
        last_status: lastStatus,
        consecutive_failures: consecutiveFailures
    });
  } catch (err) {}

  // 3. CORE LOGIC: Does this trigger a new Alert?
  if (status === "down" && consecutiveFailures >= alertThreshold) {
      
      const incident = await pool.query("SELECT id FROM incidents WHERE monitor_id = $1 AND is_resolved = false", [monitorId]);
      
      let incidentId;
      if (incident.rowCount === 0) {
          const newIncident = await pool.query("INSERT INTO incidents (monitor_id) VALUES ($1) RETURNING id", [monitorId]);
          incidentId = newIncident.rows[0].id;
          
          // Emit new incident event
          try {
            getIO().emit("incident:new", {
                incidentId,
                monitorId,
                started_at: new Date()
            });
          } catch (err) {}

      } else {
          incidentId = incident.rows[0].id;
      }

      // Check the Database State Machine!
      const currentIncident = await pool.query("SELECT alert_status FROM incidents WHERE id = $1", [incidentId]);
      
      if (currentIncident.rowCount && currentIncident.rows[0].alert_status === 'PENDING') {
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
          const incidentId = resolved.rows[0].id;
          
          // Emit incident resolved event
          try {
            getIO().emit("incident:resolved", {
                incidentId,
                monitorId,
                resolved_at: new Date()
            });
          } catch (err) {}

         await alertQueue.add(
             "send-up-alert", 
             { incidentId, monitorId, url }, 
             { jobId: `up-alert-${incidentId}` }
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

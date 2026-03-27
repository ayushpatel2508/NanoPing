import { Worker, type Job } from "bullmq";
import redisConnection from "../config/redis.js";
import  pool  from "../config/db.js";

import { sendEmail } from "../utils/sendEmail.js";

// This worker listens to the "alerts" Redis queue
export const alertWorker = new Worker("alerts", async (job: Job) => {
  const { incidentId, monitorId, url } = job.data;
  const isDownAlert = job.name === "send-down-alert";

  // 1. Fetch the user's email address from the database using a rapid JOIN
  const userQuery = await pool.query(`
      SELECT users.email 
      FROM monitors 
      JOIN users ON monitors.user_id = users.id 
      WHERE monitors.id = $1
  `, [monitorId]);

  const userEmail = userQuery.rows[0]?.email;
  if (!userEmail) throw new Error(`Could not find owner email for monitor ${monitorId}`);

  // 2. Construct the Email Templates
  const subject = isDownAlert 
      ? `🔴 URGENT: Your website ${url} is down!` 
      : `🟢 RESOLVED: Your website ${url} is back up!`;

  const primaryColor = isDownAlert ? '#ef4444' : '#10b981';
  const statusLabel = isDownAlert ? 'OFFLINE' : 'ONLINE';

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="display: inline-block; padding: 10px 20px; background: ${primaryColor}; color: white; border-radius: 30px; font-weight: bold; font-size: 14px; letter-spacing: 0.1em;">
          STATUS: ${statusLabel}
        </div>
      </div>
      
      <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 10px; text-align: center;">${isDownAlert ? 'Action Required: Outage Detected' : 'Website Restored'}</h1>
      
      <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
        Our monitoring engine has detected that <b><a href="${url}" style="color: ${primaryColor}; text-decoration: none;">${url}</a></b> ${isDownAlert ? 'has failed multiple health checks and is currently unresponsive.' : 'is back online and responding normally.'}
      </p>

      <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <div style="margin-bottom: 10px; font-size: 14px; color: #64748b;">TARGET URL</div>
        <div style="font-family: monospace; font-size: 16px; color: #0f172a; word-break: break-all;">${url}</div>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background: #0f172a; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
          View Detailed Analytics
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">
        You're receiving this because you enabled monitoring for ${url}.<br>
        &copy; ${new Date().getFullYear()} NanoPing Monitoring.
      </p>
    </div>
  `;

  // 3. Transmit the Email physically via SMTP (Will bounce to .on('failed') if Mailgun is down)
  await sendEmail(userEmail, subject, htmlBody);
}, { connection: redisConnection as any });

//the moment when the job is picked from queue
alertWorker.on("active", async (job: Job) => {
   if (job.name === "send-down-alert") {
      await pool.query("UPDATE incidents SET alert_status = 'PROCESSING' WHERE id = $1", [job.data.incidentId]);
   }
});

//the time when job is completed successfully
alertWorker.on("completed", async (job: Job) => {
   if (job.name === "send-down-alert") {
      await pool.query("UPDATE incidents SET alert_status = 'SENT' WHERE id = $1", [job.data.incidentId]);
      console.log(`[AlertWorker] Successfully updated Database UI to SENT for Incident ${job.data.incidentId}.`);
   }
});

//server crash
//here job type undefined added cause somethimes server may crash when the job is not yet picked by worker
//so in that case it has no job so we need to add undefied

alertWorker.on("failed", async (job: Job | undefined, err: Error) => {
   if (!job || job.name !== "send-down-alert") return;

   if (job.attemptsMade >= (job.opts.attempts || 5)) {
     
      console.log(`[AlertWorker DLQ] Email permanently failed for incident ${job.data.incidentId}. Database updated to FAILED.`);
      await pool.query("UPDATE incidents SET alert_status = 'FAILED' WHERE id = $1", [job.data.incidentId]);
   } else {
      console.log(`[AlertWorker] SMTP transmission failed. Rolling back Database to PENDING for retry in 1 minute.`);
      await pool.query("UPDATE incidents SET alert_status = 'PENDING' WHERE id = $1", [job.data.incidentId]);
   }
});

alertWorker.on("error", (err) => {
    console.error(`[AlertWorker Critical Error]:`, err);
});

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

  const htmlBody = isDownAlert
      ? `<h2>Action Required: Website Outage</h2>
         <p>Our ping engine has detected that <b><a href="${url}">${url}</a></b> has failed multiple health checks and is currently offline.</p>
         <p>Please check your server immediately.</p>`
      : `<h2>Website Restored</h2>
         <p>Good news! Our ping engine verified that <b><a href="${url}">${url}</a></b> is back online and responding with a 200 OK status.</p>`;

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

import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

// The Ping Queue: Holds URLs waiting to be HTTP fetched
export const pingQueue = new Queue("pings", {
  connection: redisConnection as any,
  defaultJobOptions: {
    removeOnComplete: true, // Delete successful pings from Redis to save memory
    removeOnFail: 100 // Keep the last 100 failed ping queue jobs so you can debug network errors
  }
});

// The Alert Queue: Holds the Emails waiting to be sent (with our DLQ logic)
export const alertQueue = new Queue("alerts", {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 * 60 }, // Wait 1min, then 2, 4, 8, 16 mins
    removeOnComplete: true, // Delete successful emails to save RAM
    removeOnFail: true // Delete dead jobs immediately because PostgreSQL tracks 'FAILED'
  }
});

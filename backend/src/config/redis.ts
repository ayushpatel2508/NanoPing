import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// BullMQ strictly requires ioredis (not the standard 'redis' package)
// maxRetriesPerRequest MUST be set to null for BullMQ to operate correctly without throwing errors
const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redisConnection.on('connect', () => {
    console.log('Redis connected successfully.');
});

export default redisConnection;

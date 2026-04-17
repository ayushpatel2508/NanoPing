import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisConnection from '../config/redis.js';

// Redis store factory - counters persist across restarts and scale horizontally
const createRedisStore = (prefix: string) => new RedisStore({
    sendCommand: (...args: string[]) => 
        (redisConnection as any).call(args[0], ...args.slice(1)),
    prefix: `rl:${prefix}:`,
});

// Global limiter - applies to all routes (100 req/min per IP)
export const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('global'),
    skip: () => process.env.NODE_ENV === 'test',
    message: {
        status: 'error',
        message: 'Too many requests. Please slow down and try again in a minute.',
    },
});

// Auth limiter - strict protection for login/register (5 attempts per 15 min, only counts failures)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('auth'),
    skip: () => process.env.NODE_ENV === 'test',
    message: {
        status: 'error',
        message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
    skipSuccessfulRequests: true,
});

// Write limiter - prevents spam on POST/PUT/DELETE operations (20 ops per min)
export const writeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('write'),
    skip: () => process.env.NODE_ENV === 'test',
    message: {
        status: 'error',
        message: 'Too many write operations. Please wait a moment before trying again.',
    },
});

// Public limiter - tighter limit for unauthenticated endpoints (30 req/min)
export const publicLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('public'),
    skip: () => process.env.NODE_ENV === 'test',
    message: {
        status: 'error',
        message: 'Too many requests to the public API. Please try again later.',
    },
});

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import { globalLimiter } from "./middlewares/rateLimiter.js";

dotenv.config();

import { config } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import monitorRoutes from "./routes/monitorRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import { pingWorker } from "./workers/pingWorker.js";
import { alertWorker } from "./workers/alertWorker.js";
import { startScheduler } from "./workers/scheduler.js";
import { startNightlyAggregation, startDataPurge } from "./workers/nightlyJobs.js";
import { startLogFlusher } from "./workers/logFlusher.js";
import redisConnection from "./config/redis.js";

import { initSocket } from "./config/socket.js";

const app = express();

// Middleware
app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Global rate limit: 100 requests/minute per IP on ALL routes
app.use(globalLimiter);

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World");
});

import publicRoutes from "./routes/publicRoutes.js";

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/monitors", monitorRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/public", publicRoutes);

// M9 FIX: Warn loudly if NODE_ENV is not explicitly set
if (!process.env.NODE_ENV) {
    console.warn("⚠️  WARNING: NODE_ENV is not set. Defaulting to 'development'. Set NODE_ENV=production in production!");
}

const server = app.listen(process.env.PORT, () => {
    const mode = process.env.NODE_ENV || 'development';
    console.log(` NanoPing Server is running on port ${process.env.PORT} in ${mode.toUpperCase()} mode`);
    console.log(` CORS origins allowed: ${Array.isArray(config.corsOrigins) ? config.corsOrigins.join(', ') : config.corsOrigins}`);
    
    if (config.isProd) {
        console.log(" Production security features (Secure Cookies, Strict CORS) are ENABLED.");
    }

    // Skip workers in test mode
    if (process.env.NODE_ENV !== 'test') {
        startScheduler();           // 1-minute ping cron
        startNightlyAggregation();  // Midnight stats aggregation
        startDataPurge();           // 1 AM data purge
        startLogFlusher();          // 30-second bulk insert cron
    }
});

const io = initSocket(server);

// Export app for testing
export { app, server, io };

// Graceful Shutdown: finish active jobs before killing the process
const gracefulShutdown = async () => {
    console.log("Shutting down gracefully...");
    await pingWorker.close();
    await alertWorker.close();
    io.close();
    redisConnection.quit();
    server.close(() => {
        console.log("Server successfully closed.");
        process.exit(0);
    });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

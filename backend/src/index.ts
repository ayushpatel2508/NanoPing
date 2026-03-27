import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import type { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import monitorRoutes from "./routes/monitorRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import { pingWorker } from "./workers/pingWorker.js";
import { alertWorker } from "./workers/alertWorker.js";
import { startScheduler } from "./workers/scheduler.js";
import { startNightlyAggregation, startDataPurge } from "./workers/nightlyJobs.js";
import redisConnection from "./config/redis.js";

import { createServer } from "http";
import { initSocket } from "./config/socket.js";

const app = express();
const httpServer = createServer(app);
const io = initSocket(httpServer);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/monitors", monitorRoutes);
app.use("/api/dashboard", dashboardRoutes);

const server = httpServer.listen(process.env.PORT, () => {
    const mode = process.env.NODE_ENV || 'development';
    console.log(` NanoPing Server is running on port ${process.env.PORT} in ${mode.toUpperCase()} mode`);
    
    if (mode === 'production') {
        console.log(" Production security features (Secure Cookies, Strict CORS) are ENABLED.");
    }

    startScheduler();           // 1-minute ping cron
    startNightlyAggregation();  // Midnight stats aggregation
    startDataPurge();           // 1 AM data purge
});

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

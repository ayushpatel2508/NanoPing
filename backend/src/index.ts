import express from "express";
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

const app = express();

// Middleware
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

const server = app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    startScheduler();           // 1-minute ping cron
    startNightlyAggregation();  // Midnight stats aggregation
    startDataPurge();           // 1 AM data purge
});

// Graceful Shutdown: finish active jobs before killing the process
const gracefulShutdown = async () => {
    console.log("Shutting down gracefully...");
    await pingWorker.close();
    await alertWorker.close();
    redisConnection.quit();
    server.close(() => {
        console.log("Server successfully closed.");
        process.exit(0);
    });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

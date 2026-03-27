import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log(`[Socket] New client connected: ${socket.id}`);

        socket.on("join-monitor", (monitorId: string) => {
            socket.join(`monitor-${monitorId}`);
            console.log(`[Socket] Client ${socket.id} joined room: monitor-${monitorId}`);
        });

        socket.on("disconnect", () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

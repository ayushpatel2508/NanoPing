import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import pool from "./db.js";

let io: Server;

/**
 * Parse cookies from a raw cookie header string.
 */
const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
    if (!cookieHeader) return {};
    return cookieHeader.split(";").reduce((acc, cookie) => {
        const [key, ...val] = cookie.trim().split("=");
        if (key) acc[key.trim()] = val.join("=").trim();
        return acc;
    }, {} as Record<string, string>);
};

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // M2 FIX: Authenticate WebSocket connections via JWT cookie
    io.use((socket, next) => {
        try {
            const cookies = parseCookies(socket.handshake.headers.cookie);
            const token = cookies.accessToken || cookies.refreshToken;

            if (!token) {
                return next(new Error("Unauthorized: No token provided"));
            }

            // Try access token first, fall back to refresh token
            let decoded: any = null;
            try {
                decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
            } catch {
                if (cookies.refreshToken) {
                    decoded = jwt.verify(cookies.refreshToken, process.env.JWT_REFRESH_SECRET!);
                }
            }

            if (!decoded?.id) {
                return next(new Error("Unauthorized: Invalid token"));
            }

            socket.data.userId = decoded.id;
            next();
        } catch (err) {
            next(new Error("Unauthorized: Authentication failed"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`[Socket] Authenticated client connected: ${socket.id} (user: ${socket.data.userId})`);

        socket.on("join-monitor", async (monitorId: string) => {
            try {
                // Verify the user owns this monitor before allowing them to join
                const result = await pool.query(
                    "SELECT id FROM monitors WHERE id = $1 AND user_id = $2",
                    [monitorId, socket.data.userId]
                );

                if (result.rowCount === 0) {
                    socket.emit("error", { message: "Monitor not found or access denied" });
                    return;
                }

                socket.join(`monitor-${monitorId}`);
                console.log(`[Socket] Client ${socket.id} joined room: monitor-${monitorId}`);
            } catch (err) {
                console.error(`[Socket] Error joining monitor room:`, err);
                socket.emit("error", { message: "Failed to join monitor room" });
            }
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

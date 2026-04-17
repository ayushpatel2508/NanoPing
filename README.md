# NanoPing - High-Performance Website Monitoring Platform

A distributed, real-time website monitoring engine designed for scale and reliability. Built with a decoupled architecture to handle concurrent uptime checks, automated alerting, and beautiful telemetry visualization.

## 🚀 Key Engineering Features
- **Distributed Monitoring Engine**: Decoupled worker architecture using Redis and BullMQ to handle hundreds of concurrent pings without blocking the main event loop.
- **Wait-Free Logging Architecture**: High-frequency ping logs are first buffered in Redis and asynchronously bulk-inserted into PostgreSQL every 30 seconds to minimize database I/O pressure.
- **Event-Driven Real-time Updates**: Instant status refreshes and "Render-style" live logs powered by Socket.IO room-based broadcasting.
- **Secure JWT Authentication**: JWT-based authentication with refresh tokens and HTTP-only cookies for enhanced security.
- **Intelligent Alerting**: Multi-threshold failure tracking (Email) with built-in idempotency to prevent duplicate notifications during network instability.

---

## 🛠 Tech Stack
| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Lucide |
| **Backend** | Node.js (v18+), Express 5, Socket.IO, BullMQ, Axios |
| **Persistence** | PostgreSQL (Relational Data), Redis (Queue & High-speed Cache) |
| **DevOps** | Docker, Docker Compose, GitHub Actions |

---

## 📐 System Architecture
```mermaid
graph TD
    User["Dashboard (React)"] <-->|Socket.IO / REST| API["Express API Server"]
    API <-->|Pings| PG[("PostgreSQL")]
    API -->|Queue Job| Redis[("Redis Buffer / BullMQ")]
    Redis -->|Process| PingWorker["Ping Worker (Worker Pool)"]
    PingWorker -->|Check| Target["External Sites"]
    PingWorker -->|Buffer Log| Redis
    LogFlusher["Log Flusher (Cron)"] -->|Pop & Bulk Insert| Redis
    LogFlusher -->|Commit| PG
    PingWorker -->|Trigger| AlertQueue["Alert Queue"]
    AlertQueue -->|Notify| Mail["Nodemailer / Twilio"]
```

---

## 🧠 Engineering Deep Dive (Interviewer FAQs)

### 1. How do you handle database I/O bottlenecks during high-frequency checks?
We implement a **Wait-Free Logging** pattern. Instead of writing every ping result to PostgreSQL immediately, the `PingWorker` pushes logs to a Redis list (`ping_logs_buffer`). A separate `LogFlusher` cron job atomically pops these logs (up to 1000 at a time) and performs a single SQL bulk-insertion. This reduces the number of database write operations by as much as 90%.

### 2. How are Race Conditions handled in the Monitoring Engine?
To prevent duplicate "Down" alerts if multiple workers finish simultaneously (due to retries or network drifts), we use **BullMQ Idempotency**. Every alert job is assigned a deterministic `jobId` formatted as `down-alert-${incidentId}`. Redis ensures that only one job with this specific ID can exist in the queue at any time.

### 3. How do you ensure the monitoring workers don't hang?
We use a strict 10-second timeout managed by the **AbortController API**. This prevents "zombie workers" from exhausting the Node.js worker pool when target websites are unresponsive or experiencing slow DNS lookups.

### 4. What is the Caching Strategy?
We use a **Selective Caching** layer for the Dashboard. Common views are cached in Redis with a 24-hr TTL. However, the cache is not static; it is **Event-Driven**. Any status flip (Up -> Down), monitor deletion, or manual update triggers an immediate cache invalidation for that specific user.

---

## 🛰 REST API Reference

### Auth & User
- `POST /api/auth/login` - Request JWT session
- `POST /api/auth/register` - Create account
- `GET /api/auth/me` - Profile context
- `POST /api/auth/logout` - Clear session

### Monitoring
- `POST /api/monitors` - Add new target URL
- `GET /api/monitors` - List user monitors (with pagination & status filtering)
- `GET /api/monitors/:id` - Detailed telemetry for a specific site
- `PUT /api/monitors/:id` - Update check intervals/thresholds
- `DELETE /api/monitors/:id` - Purge target & associated history

### Dashboard & Analytics
- `GET /api/dashboard/summary` - Aggregated global stats (Monitors Up vs Down)
- `GET /api/dashboard/global-stats` - 30-day uptime overview
- `GET /api/dashboard/all-monitor-stats` - Detailed multi-monitor health map

---

## ⚡ Quick Start (Local Setup)

1. **Spin up Infrastructure**:
   ```bash
   docker-compose up -d  # Starts PostgreSQL and Redis
   ```

2. **Backend Setup**:
   ```bash
   cd backend && npm install
   cp .env.example .env  # Configure your Postgres & Redis URLs
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend && npm install
   npm run dev
   ```

---


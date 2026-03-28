# NanoPing - Real-time Website Monitoring

A robust real-time website monitoring platform that tracks the uptime and response time of your websites, providing instant alerts when issues occur. Features include live status updates, detailed activity logs, incident history, and beautiful analytics dashboards.

## Features

### Real-time Monitoring & Communication
- **Real-time Status Updates**: Powered by Socket.IO for instant dashboard refreshes across all participants.
- **Smart Notifications**: Alerts triggered via Email/SMS using Nodemailer and Twilio after consecutive failures.
- **Dynamic Ping History**: Real-time "Render-style" logs showing every ping attempt and its result.

### User Management
- **Hybrid Authentication**: Secure JWT-based manual registration/login alongside Clerk (OAuth) integration.
- **User Profiles**: Manage your monitors, account settings, and notification preferences.
- **Session Security**: HTTP-only cookies and protected routes for secure data access.

### Monitor Management
- **Customizable Checks**: Easily add websites with user-defined check intervals (1-60 min) and alert thresholds.
- **Incident History**: Full transparency of all past downtime events with duration tracking.
- **Analytics Dashboards**: Interactive charts for daily uptime and response time history using Recharts.

## Tech Stack

### Client (Frontend)
| Technology | Purpose |
| :--- | :--- |
| React 18 | UI Library |
| Vite | Build Tool |
| Tailwind CSS | Utility-first CSS Styling |
| Radix UI | Accessible Component Primitives |
| Socket.IO Client | Real-time Communication |
| Recharts | Data Visualization |
| Clerk | Authentication |
| Axios | HTTP Client |
| Lucide React | Icon Pack |

### Server (Backend)
| Technology | Purpose |
| :--- | :--- |
| Node.js | Runtime Environment |
| Express 5 | Web Framework |
| Socket.IO | Real-time Events |
| PostgreSQL | Database (Raw SQL via `pg`) |
| Redis + BullMQ | Background Worker Queue |
| JWT | Authentication Tokens |
| bcryptjs | Password Hashing |
| Nodemailer | Email Alerts |
| Twilio | SMS Alerts |

## Project Structure

```text
ping-website/
├── frontend/               # React Frontend (Vite)
│   └── src/
│       ├── components/     # UI Components (layouts, ui, etc)
│       ├── pages/          # Full Page Views (Dashboard, Login, etc)
│       ├── services/       # API and Socket Services
│       ├── store/          # Redux/Zustand State Management
│       └── hooks/          # Custom React Hooks
│
└── backend/                # Node.js Backend (Express)
    └── src/
        ├── controllers/    # API Controllers
        ├── models/         # Database Table Definitions
        ├── routes/         # API Route Handlers
        ├── workers/        # BullMQ Monitor Workers
        ├── scripts/        # Database setup and migrations
        └── utils/          # Helper utilities
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Local or managed)
- Redis Server (Required for BullMQ)

### Environment Variables

#### Server (`backend/.env`):
```env
PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/nanoping
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
CLERK_SECRET_KEY=your_clerk_key
EMAIL_HOST=smtp.example.com
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

#### Client (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ayushpatel2508/NanoPing
   cd ping-website
   ```

2. Install Server Dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install Client Dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

## Running Locally

### Terminal 1 - Server:
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:5000`

### Terminal 2 - Client:
```bash
cd frontend
npm run dev
```
Client runs on `http://localhost:5173`

## API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login user | Public |
| POST | /api/auth/clerk-sync | Sync Clerk session | Public/Clerk |
| GET | /api/auth/me | Get profile | Protected |

### Monitors
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | /api/monitors | Create new monitor | Protected |
| GET | /api/monitors | Get all user monitors | Protected |
| GET | /api/monitors/:id | Get monitor details | Protected |
| PUT | /api/monitors/:id | Update monitor | Protected |
| DELETE | /api/monitors/:id | Delete monitor | Protected |

### Analytics & Logs
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | /api/dashboard/summary | Global stats summary | Protected |
| GET | /api/monitors/:id/checks | Get recent ping logs | Protected |
| GET | /api/monitors/:id/stats | Get daily uptime stats | Protected |
| GET | /api/monitors/:id/incidents| Get incident history | Protected |

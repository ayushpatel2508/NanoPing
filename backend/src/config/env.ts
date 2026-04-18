// Centralized environment configuration.


const isDev = process.env.NODE_ENV !== 'production';

// --- Dev defaults ---
const DEV_FRONTEND_URL = 'http://localhost:5173';
const DEV_BACKEND_URL = 'http://localhost:3000';

export const config = {
    isDev,
    isProd: !isDev,

    /** The frontend URL — used for email links */
    frontendUrl: isDev
        ? DEV_FRONTEND_URL
        : process.env.FRONTEND_URL!,

    /** CORS Origins accepted by the backend */
    corsOrigins: isDev 
        ? [DEV_FRONTEND_URL, 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176']
        : process.env.FRONTEND_URL!,

    /** The backend URL — used if backend needs to self-reference */
    backendUrl: isDev
        ? DEV_BACKEND_URL
        : (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`),

    /** Server port */
    port: process.env.PORT || 3000,
};

/**
 * Centralized environment configuration for the Frontend.
 * 
 * Vite automatically sets `import.meta.env.MODE` to:
 * - 'development' when running `npm run dev`
 * - 'production' when running `npm run build`
 */

export const isDev = import.meta.env.MODE === 'development';
export const isProd = import.meta.env.MODE === 'production';

// In development, force the local backend URL.
// In production, use the provided VITE_API_URL or default to the same origin (relative '/api')
export const BACKEND_URL = isDev
  ? 'http://localhost:3000'
  : (import.meta.env.VITE_API_URL || window.location.origin);

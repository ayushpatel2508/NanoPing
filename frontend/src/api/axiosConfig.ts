import axios from 'axios';
import { BACKEND_URL } from '../config/env';

const api = axios.create({
  // Automatically routes to localhost:3000 in dev or VITE_API_URL in production
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;

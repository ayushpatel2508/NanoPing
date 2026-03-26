import { create } from 'zustand';
import { authApi } from '../api/auth';

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } 
    catch { return null; }
  })(),
  isAuthenticated: !!localStorage.getItem('user'),
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(credentials);
      if (response.status === 'success') {
        const user = response.data;
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true, isLoading: false });
        return true;
      }
      set({ error: response.message || 'Login failed', isLoading: false });
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Invalid email or password.', isLoading: false });
      return false;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(userData);
      if (response.status === 'success') {
        set({ isLoading: false });
        return true;
      }
      set({ error: response.message || 'Registration failed', isLoading: false });
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Registration failed. Email might already exist.', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (e) {}
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.status === 'success') {
        localStorage.setItem('user', JSON.stringify(response.data));
        set({ user: response.data, isAuthenticated: true });
      }
    } catch (err) {
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    }
  }
}));

import { create } from 'zustand';
import { monitorApi } from '../api/monitors';
import { dashboardApi } from '../api/dashboard';

interface MonitorState {
  monitors: any[];
  summaryStats: any | null;
  isLoading: boolean;
  error: string | null;
  globalChecks: any[];
  globalStats: any[];
  globalIncidents: any[];
  
  fetchMonitors: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchGlobalData: () => Promise<void>;
  createMonitor: (data: any) => Promise<boolean>;
  deleteMonitor: (id: string) => Promise<boolean>;
}

export const useMonitorStore = create<MonitorState>((set, get) => ({
  monitors: [],
  summaryStats: null,
  globalChecks: [],
  globalStats: [],
  globalIncidents: [],
  isLoading: false,
  error: null,

  fetchMonitors: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await monitorApi.getMonitors();
      if (res.status === 'success') {
        set({ monitors: res.data.monitors, isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchSummary: async () => {
    try {
      const res = await dashboardApi.getSummaryStats();
      if (res.status === 'success') {
        set({ summaryStats: res.data });
      }
    } catch (err: any) {
      console.error("Failed to fetch summary stats", err);
    }
  },

  fetchGlobalData: async () => {
    try {
      const [chkRes, stRes, incRes] = await Promise.all([
        dashboardApi.getGlobalChecks(50),
        dashboardApi.getGlobalStats(30),
        dashboardApi.getGlobalIncidents(20)
      ]);
      set({
        globalChecks: chkRes.success ? chkRes.data : [],
        globalStats: stRes.success ? stRes.data : [],
        globalIncidents: incRes.success ? incRes.data : [],
      });
    } catch (err: any) {
      console.error("Failed to fetch global dashboard data", err);
    }
  },

  createMonitor: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const res = await monitorApi.createMonitor(data);
      if (res.status === 'success') {
        get().fetchMonitors();
        get().fetchSummary();
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to create monitor', isLoading: false });
      return false;
    }
  },
  
  deleteMonitor: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await monitorApi.deleteMonitor(id);
      get().fetchMonitors();
      get().fetchSummary();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to delete monitor', isLoading: false });
      return false;
    }
  }
}));

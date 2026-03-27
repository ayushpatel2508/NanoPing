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
  
  // Real-time WebSocket updates
  updateMonitorStatus: (data: any) => void;
  addGlobalCheck: (check: any) => void;
  addGlobalIncident: (incident: any) => void;
  resolveGlobalIncident: (data: any) => void;
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
      if (res.success) {
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
  },

  updateMonitorStatus: (data: any) => {
    set((state) => {
      const monitor = state.monitors.find(m => m.id === data.monitorId);
      if (!monitor) return {
        monitors: state.monitors.map((m) =>
          m.id === data.monitorId
            ? { ...m, last_status: data.last_status, consecutive_failures: data.consecutive_failures }
            : m
        )
      };

      const oldStatus = monitor.last_status;
      const newStatus = data.last_status;

      let newSummary = state.summaryStats;
      if (newSummary && oldStatus !== newStatus && monitor.is_active) {
        newSummary = { ...newSummary };
        if (oldStatus === 'up') newSummary.monitors_up = (Math.max(0, parseInt(newSummary.monitors_up) - 1)).toString();
        if (oldStatus === 'down') newSummary.monitors_down = (Math.max(0, parseInt(newSummary.monitors_down) - 1)).toString();
        
        if (newStatus === 'up') newSummary.monitors_up = (parseInt(newSummary.monitors_up) + 1).toString();
        if (newStatus === 'down') newSummary.monitors_down = (parseInt(newSummary.monitors_down) + 1).toString();
      }

      return {
        monitors: state.monitors.map((m) =>
          m.id === data.monitorId
            ? { ...m, last_status: newStatus, consecutive_failures: data.consecutive_failures }
            : m
        ),
        summaryStats: newSummary
      };
    });
  },

  addGlobalCheck: (check: any) => {
    set((state) => ({
      globalChecks: [check, ...state.globalChecks].slice(0, 50),
    }));
  },

  addGlobalIncident: (incident: any) => {
    set((state) => ({
      globalIncidents: [incident, ...state.globalIncidents].slice(0, 20),
    }));
  },

  resolveGlobalIncident: (data: any) => {
    set((state) => ({
      globalIncidents: state.globalIncidents.map((inc) =>
        inc.id === data.incidentId
          ? {
              ...inc,
              is_resolved: true,
              resolved_at: data.resolved_at,
              duration_seconds: Math.floor(
                (new Date(data.resolved_at).getTime() - new Date(inc.started_at).getTime()) / 1000
              ),
            }
          : inc
      ),
    }));
  }
}));

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
  
  // Advanced Caching
  dashboardChecksCache: Record<string, any[]>;
  monitorDetailsCache: Record<string, { monitor: any; checks: any[]; stats: any[]; incidents: any[]; lastFetched: number }>;
  
  fetchDashboardChecksCache: (monitors: any[]) => Promise<void>;
  fetchMonitorDetail: (id: string) => Promise<void>;
  addDashboardCheckToCache: (monitorId: string, check: any) => void;
  updateMonitorDetailCacheFromSocket: (type: 'check' | 'status' | 'incident' | 'resolve', data: any) => void;
}

export const useMonitorStore = create<MonitorState>((set, get) => ({
  monitors: [],
  summaryStats: null,
  globalChecks: [],
  globalStats: [],
  globalIncidents: [],
  dashboardChecksCache: {},
  monitorDetailsCache: {},
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
            ? { ...m, last_status: data.last_status, last_checked: data.last_checked, consecutive_failures: data.consecutive_failures }
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
            ? { ...m, last_status: newStatus, last_checked: data.last_checked, consecutive_failures: data.consecutive_failures }
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
  },

  fetchDashboardChecksCache: async (monitors: any[]) => {
    const { dashboardChecksCache } = get();
    const monitorsToFetch = monitors.filter(m => !dashboardChecksCache[m.id]);
    
    if (monitorsToFetch.length === 0) return; // All cached

    const newCache: Record<string, any[]> = {};
    await Promise.all(
      monitorsToFetch.map(async (m: any) => {
        try {
          const res = await dashboardApi.getRecentChecks(m.id);
          if (res.success) newCache[m.id] = res.data.slice(0, 20);
        } catch { }
      })
    );
    
    set((state) => ({
      dashboardChecksCache: { ...state.dashboardChecksCache, ...newCache }
    }));
  },

  fetchMonitorDetail: async (id: string) => {
    const { monitorDetailsCache } = get();
    const cached = monitorDetailsCache[id];
    
    // If cached within the last 60 seconds, use it silently without loading spinner
    if (cached && Date.now() - cached.lastFetched < 60000) {
      return; 
    }

    set({ isLoading: true, error: null });
    try {
      const [monRes, chkRes, stRes, incRes] = await Promise.all([
        monitorApi.getMonitorDetails(id),
        dashboardApi.getRecentChecks(id, 1500),
        dashboardApi.getMonitorStats(id, 30),
        dashboardApi.getIncidents(id, 50),
      ]);
      
      const newData = {
        monitor: monRes.status === 'success' ? monRes.data : null,
        checks: chkRes.success ? chkRes.data : [],
        stats: stRes.success ? stRes.data : [],
        incidents: incRes.success ? incRes.data : [],
        lastFetched: Date.now()
      };

      if (newData.monitor) {
        set((state) => ({
          monitorDetailsCache: {
            ...state.monitorDetailsCache,
            [id]: newData
          },
          isLoading: false
        }));
      } else {
        set({ isLoading: false, error: "Monitor not found" });
      }
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  addDashboardCheckToCache: (monitorId: string, check: any) => {
    set((state) => {
      const existing = state.dashboardChecksCache[monitorId] || [];
      return {
        dashboardChecksCache: {
          ...state.dashboardChecksCache,
          [monitorId]: [check, ...existing].slice(0, 20)
        }
      };
    });
  },

  updateMonitorDetailCacheFromSocket: (type, data) => {
    set((state) => {
      let id = '';
      if (type === 'check') id = data.monitor_id;
      if (type === 'status') id = data.monitorId;
      if (type === 'incident') id = data.monitor_id;
      if (type === 'resolve') id = data.monitor_id; // assuming resolved event has monitor_id or we need to find it

      // Fallback to find incident's monitorId if not explicitly provided
      if (type === 'resolve' && !id && data.incidentId) {
         for (const [monId, cacheObj] of Object.entries(state.monitorDetailsCache)) {
             if (cacheObj.incidents.some(i => i.id === data.incidentId)) {
                 id = monId;
                 break;
             }
         }
      }

      const cached = state.monitorDetailsCache[id];
      if (!cached) return state; // Don't cache if not loaded

      const updated = { ...cached };

      if (type === 'check') {
        updated.checks = [data, ...updated.checks];
        updated.monitor = { ...updated.monitor, last_checked: data.checked_at, last_status: data.status };
      }
      if (type === 'status') {
        updated.monitor = { ...updated.monitor, last_status: data.last_status, consecutive_failures: data.consecutive_failures };
      }
      if (type === 'incident') {
        updated.incidents = [data, ...updated.incidents];
      }
      if (type === 'resolve') {
        updated.incidents = updated.incidents.map((inc) =>
          inc.id === data.incidentId
            ? {
                ...inc,
                is_resolved: true,
                resolved_at: data.resolved_at,
                duration_seconds: Math.floor((new Date(data.resolved_at).getTime() - new Date(inc.started_at).getTime()) / 1000)
              }
            : inc
        );
      }

      return {
        monitorDetailsCache: {
          ...state.monitorDetailsCache,
          [id]: updated
        }
      };
    });
  }
}));

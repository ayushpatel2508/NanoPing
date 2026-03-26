import api from './axiosConfig';

export const dashboardApi = {
  getSummaryStats: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
  getRecentChecks: async (id: string, limit = 50) => {
    const response = await api.get(`/dashboard/${id}/checks?limit=${limit}`);
    return response.data;
  },
  getMonitorStats: async (id: string, days = 30) => {
    const response = await api.get(`/dashboard/${id}/stats?days=${days}`);
    return response.data;
  },
  getIncidents: async (id: string, limit = 50) => {
    const response = await api.get(`/dashboard/${id}/incidents?limit=${limit}`);
    return response.data;
  },
  getGlobalChecks: async (limit = 50) => {
    const response = await api.get(`/dashboard/global-checks?limit=${limit}`);
    return response.data;
  },
  getGlobalStats: async (days = 30) => {
    const response = await api.get(`/dashboard/global-stats?days=${days}`);
    return response.data;
  },
  getGlobalIncidents: async (limit = 20) => {
    const response = await api.get(`/dashboard/global-incidents?limit=${limit}`);
    return response.data;
  }
};


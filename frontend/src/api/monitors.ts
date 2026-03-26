import api from './axiosConfig';

export const monitorApi = {
  getMonitors: async () => {
    const response = await api.get('/monitors');
    return response.data;
  },
  createMonitor: async (data: any) => {
    const response = await api.post('/monitors', data);
    return response.data;
  },
  getMonitorDetails: async (id: string) => {
    const response = await api.get(`/monitors/${id}`);
    return response.data;
  },
  updateMonitor: async (id: string, data: any) => {
    const response = await api.put(`/monitors/${id}`, data);
    return response.data;
  },
  toggleStatus: async (id: string, is_active: boolean) => {
    const response = await api.patch(`/monitors/${id}/status`, { is_active });
    return response.data;
  },
  deleteMonitor: async (id: string) => {
    const response = await api.delete(`/monitors/${id}`);
    return response.data;
  }
};

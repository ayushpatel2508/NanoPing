import api from './axiosConfig';

export const userApi = {
  updateProfile: async (data: { name: string }) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },
  changePassword: async (data: any) => {
    const response = await api.post('/users/change-password', data);
    return response.data;
  },
  deleteAccount: async (data: any) => {
    const response = await api.delete('/users/account', { data });
    return response.data;
  }
};

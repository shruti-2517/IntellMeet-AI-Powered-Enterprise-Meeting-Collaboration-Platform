import api from './api';

export const userService = {
  async getProfile() {
    const { data } = await api.get('/users/me');
    return data.data;
  },

  async updateProfile(updates: { name?: string; bio?: string; }) {
    const { data } = await api.patch('/users/me', updates);
    return data.data;
  },
};

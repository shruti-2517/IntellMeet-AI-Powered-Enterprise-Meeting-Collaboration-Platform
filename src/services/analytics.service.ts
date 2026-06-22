import api from './api';

export const analyticsService = {
  async getAnalytics() {
    const { data } = await api.get('/analytics');
    return data.data;
  },

  async getUserAnalytics() {
    const { data } = await api.get('/analytics/user');
    return data.data;
  },
};

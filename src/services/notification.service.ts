import api from './api';

export const notificationService = {
  async getNotifications() {
    const { data } = await api.get('/notifications');
    return data.data; // { notifications }
  },

  async markRead(id: string) {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data.data;
  },

  async markAllRead() {
    const { data } = await api.patch('/notifications/read-all');
    return data.data;
  },
};

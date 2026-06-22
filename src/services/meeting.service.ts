import api from './api';

export const meetingService = {
  async getMeetings(params?: { status?: string; limit?: number }) {
    const { data } = await api.get('/meetings', { params });
    return data.data; // { meetings, total, ... }
  },

  async createMeeting(payload: { title: string; description?: string; scheduledAt?: string; team?: string }) {
    const { data } = await api.post('/meetings', payload);
    return data.data;
  },

  async getMeetingById(id: string) {
    const { data } = await api.get(`/meetings/${id}`);
    return data.data;
  },

  async endMeeting(id: string) {
    const { data } = await api.patch(`/meetings/${id}/end`);
    return data.data;
  },
};

import api from './api';

export const messageService = {
  async getMessages(teamId: string, params?: { limit?: number; before?: string }) {
    const { data } = await api.get('/messages', { params: { team: teamId, ...params } });
    return data.data; // { messages }
  },

  async sendMessage(payload: { content: string; team: string; type?: string }) {
    const { data } = await api.post('/messages', payload);
    return data.data;
  },
};

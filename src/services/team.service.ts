import api from './api';

export const teamService = {
  async getTeams() {
    const { data } = await api.get('/teams');
    return data.data;
  },

  async getTeamById(id: string) {
    const { data } = await api.get(`/teams/${id}`);
    return data.data;
  },

  async getTeamMembers(id: string) {
    const { data } = await api.get(`/teams/${id}/members`);
    return data.data;
  },
};

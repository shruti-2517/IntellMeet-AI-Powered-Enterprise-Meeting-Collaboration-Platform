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

  async inviteMember(teamId: string, email: string, role: string = 'member') {
    const { data } = await api.post(`/teams/${teamId}/invite`, { email, role });
    return data.data;
  },
};

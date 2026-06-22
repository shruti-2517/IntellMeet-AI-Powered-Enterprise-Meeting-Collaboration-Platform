import api from './api';

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { name: string; email: string; password: string; }

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post('/auth/login', payload);
    return data.data; // { accessToken, refreshToken, user }
  },

  async register(payload: RegisterPayload) {
    const { data } = await api.post('/auth/register', payload);
    return data.data;
  },

  async logout() {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
  },

  async getMe() {
    const { data } = await api.get('/auth/me');
    return data.data; // user object
  },
}; export type Page = 'landing' |
  'login' |
  'register' |
  'dashboard' |
  'meeting-room' |
  'meeting-lobby' |
  'ai-summary' |
  'team-workspace' |
  'kanban' |
  'analytics' |
  'chat' |
  'profile' |
  'settings' |
  'notifications';


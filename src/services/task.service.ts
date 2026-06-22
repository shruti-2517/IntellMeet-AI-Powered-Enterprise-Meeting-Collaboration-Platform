import api from './api';

export const taskService = {
  async getTasks(params?: { team?: string; status?: string }) {
    const { data } = await api.get('/tasks', { params });
    return data.data; // { tasks }
  },

  async createTask(payload: { title: string; description?: string; priority?: string; team?: string; dueDate?: string }) {
    const { data } = await api.post('/tasks', payload);
    return data.data;
  },

  async updateTask(id: string, updates: { status?: string; column?: string; title?: string; priority?: string }) {
    const { data } = await api.patch(`/tasks/${id}`, updates);
    return data.data;
  },

  async deleteTask(id: string) {
    await api.delete(`/tasks/${id}`);
  },
};

import { apiClient } from '../../services/apiClient';

export const trainersApi = {
  getTrainers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/trainers${query ? `?${query}` : ''}`);
  },

  getTrainerById: async (id) => {
    return apiClient(`/trainers/${id}`);
  },

  createTrainer: async (data) => {
    return apiClient('/trainers', { method: 'POST', body: data });
  },

  updateTrainer: async (id, data) => {
    return apiClient(`/trainers/${id}`, { method: 'PATCH', body: data });
  },
};

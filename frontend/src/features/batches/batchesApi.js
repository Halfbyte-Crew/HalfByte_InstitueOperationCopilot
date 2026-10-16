import { apiClient } from '../../services/apiClient';

export const batchesApi = {
  getBatches: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/batches${query ? `?${query}` : ''}`);
  },

  getBatchById: async (id) => {
    return apiClient(`/batches/${id}`);
  },

  createBatch: async (data) => {
    return apiClient('/batches', { method: 'POST', body: data });
  },

  updateBatch: async (id, data) => {
    return apiClient(`/batches/${id}`, { method: 'PATCH', body: data });
  },

  getEnrollments: async (batchId) => {
    return apiClient(`/batches/${batchId}/enrollments`);
  },

  enrollStudent: async (batchId, data) => {
    return apiClient(`/batches/${batchId}/enrollments`, { method: 'POST', body: data });
  },
};

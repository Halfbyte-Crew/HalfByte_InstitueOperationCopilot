import { apiClient } from '../../services/apiClient';

export const feesApi = {
  getFees: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/fees${query ? `?${query}` : ''}`);
  },

  getFeeOverview: async () => {
    return apiClient('/fees/overview');
  },

  createFeeInstallment: async (data) => {
    return apiClient('/fees', { method: 'POST', body: data });
  },

  recordPayment: async (installmentId, data) => {
    return apiClient(`/fees/${installmentId}/payments`, { method: 'POST', body: data });
  },
};

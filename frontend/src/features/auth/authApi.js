import { apiClient } from '../../services/apiClient';

export const authApi = {
  login: async (email, password) => {
    return apiClient('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  getCurrentUser: async () => {
    return apiClient('/auth/me');
  },

  logout: async () => {
    return apiClient('/auth/logout', { method: 'POST' });
  },
};

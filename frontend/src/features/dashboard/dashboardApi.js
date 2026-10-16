import { apiClient } from '../../services/apiClient';

export const dashboardApi = {
  getStats: async () => {
    return apiClient('/dashboard/stats');
  },

  getRecentActivity: async () => {
    return apiClient('/dashboard/recent-activity');
  },
};

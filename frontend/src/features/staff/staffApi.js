import { apiClient } from '../../services/apiClient';

export const staffApi = {
  getStaff: (params) => apiClient('/staff', { params }),
  getStaffMember: (id) => apiClient(`/staff/${id}`),
  createStaff: (payload) => apiClient('/staff', { method: 'POST', body: payload }),
  updateStaff: (id, payload) => apiClient(`/staff/${id}`, { method: 'PATCH', body: payload }),
  toggleStaffStatus: (id) => apiClient(`/staff/${id}/toggle-status`, { method: 'POST' }),
};

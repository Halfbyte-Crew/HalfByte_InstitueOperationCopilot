import { apiClient } from '../../services/apiClient';

/**
 * Staff & Faculty Management API Client.
 * Provides administrative control over staff records, role assignments,
 * active directory status, and credential provisioning (Counselor, Trainer, Finance).
 */
export const staffApi = {
  getStaff: (params) => apiClient('/staff', { params }),
  getStaffMember: (id) => apiClient(`/staff/${id}`),
  createStaff: (payload) => apiClient('/staff', { method: 'POST', body: payload }),
  updateStaff: (id, payload) => apiClient(`/staff/${id}`, { method: 'PATCH', body: payload }),
  resetStaffPassword: (id, password) =>
    apiClient(`/staff/${id}/reset-password`, { method: 'POST', body: { password } }),
  toggleStaffStatus: (id) => apiClient(`/staff/${id}/toggle-status`, { method: 'POST' }),
};

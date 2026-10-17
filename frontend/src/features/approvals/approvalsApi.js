import { apiClient } from '../../services/apiClient';

export const approvalsApi = {
  getApprovals: (params) => apiClient('/approvals', { params }),
  getApprovalCounts: () => apiClient('/approvals/counts'),
  getApproval: (id) => apiClient(`/approvals/${id}`),
  createApproval: (payload) => apiClient('/approvals', { method: 'POST', body: payload }),
  approveRequest: (id) => apiClient(`/approvals/${id}/approve`, { method: 'POST' }),
  rejectRequest: (id, reason) =>
    apiClient(`/approvals/${id}/reject`, { method: 'POST', body: { reason } }),
};

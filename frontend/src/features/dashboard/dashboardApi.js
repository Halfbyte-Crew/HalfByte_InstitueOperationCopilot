import { apiClient } from '../../services/apiClient';

/**
 * Dashboard API clients — one function per role-scoped endpoint.
 * Financial endpoints are intentionally absent from trainer and student groups.
 */
export const dashboardApi = {
  // ── Admin Dashboard ───────────────────────────────────────────────────────
  getAdminOverview: () => apiClient('/dashboard/admin/overview'),
  getUpcomingClasses: (params) => apiClient('/dashboard/admin/upcoming-classes', { params }),
  getConflicts: () => apiClient('/dashboard/admin/conflicts'),
  getAlerts: () => apiClient('/dashboard/admin/alerts'),
  acknowledgeAlert: (alertId) =>
    apiClient(`/dashboard/admin/alerts/${alertId}/acknowledge`, { method: 'POST' }),
  createSchedule: (payload) =>
    apiClient('/dashboard/admin/schedules', { method: 'POST', body: payload }),
  updateSchedule: (scheduleId, payload) =>
    apiClient(`/dashboard/admin/schedules/${scheduleId}`, { method: 'PATCH', body: payload }),
  deleteSchedule: (scheduleId) =>
    apiClient(`/dashboard/admin/schedules/${scheduleId}`, { method: 'DELETE' }),

  // ── Owner / Legacy Admin ──────────────────────────────────────────────────
  getOwnerStats: () => apiClient('/dashboard/owner/stats'),

  // ── Counselor ────────────────────────────────────────────────────────────
  getCounselorSummary: () => apiClient('/dashboard/counselor/summary'),

  // ── Trainer (no fee endpoints) ───────────────────────────────────────────
  getTrainerSchedule: () => apiClient('/dashboard/trainer/schedule'),

  // ── Accounts / Finance ───────────────────────────────────────────────────
  getAccountsOverview: () => apiClient('/dashboard/accounts/overview'),

  // ── Student ──────────────────────────────────────────────────────────────
  getStudentProfile: () => apiClient('/dashboard/student/profile'),

  // ── Legacy (kept for backward compatibility) ─────────────────────────────
  getStats: () => apiClient('/dashboard/admin/overview'),
  getRecentActivity: () => apiClient('/dashboard/recent-activity'),
};

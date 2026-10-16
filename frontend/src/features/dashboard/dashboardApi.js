import { apiClient } from '../../services/apiClient';

/**
 * Dashboard API clients — one function per role-scoped endpoint.
 * Financial endpoints are intentionally absent from trainer and student groups.
 */
export const dashboardApi = {
  // ── Owner / Admin ────────────────────────────────────────────────────────
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
  getStats: () => apiClient('/dashboard/owner/stats'),
  getRecentActivity: () => apiClient('/dashboard/recent-activity'),
};

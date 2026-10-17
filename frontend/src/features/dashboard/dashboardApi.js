import { apiClient } from '../../services/apiClient';

/**
 * Dashboard API clients — role-scoped endpoints.
 * Exported both as named functions and as properties of dashboardApi for full compatibility.
 */

// ── Admin Dashboard ─────────────────────────────────────────────────────────
export const getAdminOverview = () => apiClient('/dashboard/admin/overview');
export const getUpcomingClasses = (params) => apiClient('/dashboard/admin/upcoming-classes', { params });
export const getConflicts = () => apiClient('/dashboard/admin/conflicts');
export const getAlerts = () => apiClient('/dashboard/admin/alerts');
export const acknowledgeAlert = (alertId) =>
  apiClient(`/dashboard/admin/alerts/${alertId}/acknowledge`, { method: 'POST' });
export const createSchedule = (payload) =>
  apiClient('/dashboard/admin/schedules', { method: 'POST', body: payload });
export const updateSchedule = (scheduleId, payload) =>
  apiClient(`/dashboard/admin/schedules/${scheduleId}`, { method: 'PATCH', body: payload });
export const deleteSchedule = (scheduleId) =>
  apiClient(`/dashboard/admin/schedules/${scheduleId}`, { method: 'DELETE' });

// ── Owner / Legacy Admin ────────────────────────────────────────────────────
export const getOwnerStats = () => apiClient('/dashboard/owner/stats');

// ── Counselor ──────────────────────────────────────────────────────────────
export const getCounselorSummary = () => apiClient('/counselor/summary');
export const getCounselorEnquiries = (params) => apiClient('/counselor/enquiries', { params });
export const createCounselorEnquiry = (payload) =>
  apiClient('/counselor/enquiries', { method: 'POST', body: payload });
export const getCounselorEnquiryDetail = (id) => apiClient(`/counselor/enquiries/${id}`);
export const updateCounselorEnquiry = (id, payload) =>
  apiClient(`/counselor/enquiries/${id}`, { method: 'PATCH', body: payload });
export const recordCounselorInteraction = (id, payload) =>
  apiClient(`/counselor/enquiries/${id}/interactions`, { method: 'POST', body: payload });
export const convertCounselorEnquiry = (id, payload) =>
  apiClient(`/counselor/enquiries/${id}/convert`, { method: 'POST', body: payload });

export const getCounselorStudents = (params) => apiClient('/counselor/students', { params });
export const getCounselorStudentDetail = (id) => apiClient(`/counselor/students/${id}`);

export const getCounselorFollowUps = (params) => apiClient('/counselor/follow-ups', { params });
export const createCounselorFollowUp = (payload) =>
  apiClient('/counselor/follow-ups', { method: 'POST', body: payload });
export const updateCounselorFollowUp = (id, payload) =>
  apiClient(`/counselor/follow-ups/${id}`, { method: 'PATCH', body: payload });
export const completeCounselorFollowUp = (id, payload) =>
  apiClient(`/counselor/follow-ups/${id}/complete`, { method: 'POST', body: payload });
export const rescheduleCounselorFollowUp = (id, payload) =>
  apiClient(`/counselor/follow-ups/${id}/reschedule`, { method: 'POST', body: payload });

export const getCounselorAdmissions = (params) => apiClient('/counselor/admissions', { params });
export const getCounselorAdmissionDetail = (id) => apiClient(`/counselor/admissions/${id}`);
export const updateCounselorAdmissionStage = (id, payload) =>
  apiClient(`/counselor/admissions/${id}`, { method: 'PATCH', body: payload });
export const submitCounselorAdmissionApproval = (id, payload) =>
  apiClient(`/counselor/admissions/${id}/submit-approval`, { method: 'POST', body: payload });

export const getCounselorNextActions = () => apiClient('/counselor/next-actions');

// ── Trainer ────────────────────────────────────────────────────────────────
export const getTrainerSchedule = () => apiClient('/dashboard/trainer/schedule');

// ── Accounts / Finance ─────────────────────────────────────────────────────
export const getAccountsOverview = () => apiClient('/dashboard/accounts/overview');

// ── Student ────────────────────────────────────────────────────────────────
export const getStudentProfile = () => apiClient('/dashboard/student/profile');

// ── Legacy Aliases ─────────────────────────────────────────────────────────
export const getStats = getAdminOverview;
export const getRecentActivity = () => apiClient('/dashboard/recent-activity');

export const dashboardApi = {
  // Admin
  getAdminOverview,
  getUpcomingClasses,
  getConflicts,
  getAlerts,
  acknowledgeAlert,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  // Owner
  getOwnerStats,
  // Counselor
  getCounselorSummary,
  getCounselorEnquiries,
  createEnquiry: createCounselorEnquiry,
  getEnquiryDetail: getCounselorEnquiryDetail,
  updateEnquiry: updateCounselorEnquiry,
  recordEnquiryInteraction: recordCounselorInteraction,
  convertEnquiry: convertCounselorEnquiry,
  getCounselorStudents,
  getCounselorStudentDetail,
  getFollowUps: getCounselorFollowUps,
  getCounselorFollowUps,
  createFollowUp: createCounselorFollowUp,
  createCounselorFollowUp,
  updateFollowUp: updateCounselorFollowUp,
  updateCounselorFollowUp,
  completeFollowUp: completeCounselorFollowUp,
  completeCounselorFollowUp,
  rescheduleFollowUp: rescheduleCounselorFollowUp,
  rescheduleCounselorFollowUp,
  getCounselorAdmissions,
  getAdmissionDetail: getCounselorAdmissionDetail,
  getCounselorAdmissionDetail,
  updateAdmission: updateCounselorAdmissionStage,
  updateCounselorAdmissionStage,
  submitAdmissionApproval: submitCounselorAdmissionApproval,
  submitCounselorAdmissionApproval,
  getNextActions: getCounselorNextActions,
  getCounselorNextActions,
  // Trainer
  getTrainerSchedule,
  // Accounts
  getAccountsOverview,
  // Student
  getStudentProfile,
  // Legacy
  getStats,
  getRecentActivity,
};

import { apiClient } from '../../services/apiClient';

/**
 * Dashboard API clients — role-scoped institute operations endpoints.
 * Includes complete coverage for Admin, Counselor, Trainer, Accounts/Finance, and Student portals.
 * Exported both as named functions and as unified properties of `dashboardApi`.
 */

// ===========================================================================
// 1. Admin Dashboard APIs (Timetable, Conflict Detection, Faculty Alerts)
// ===========================================================================

/** Fetches institute high-level operational overview, room utilization, and pending alerts. */
export const getAdminOverview = () => apiClient('/dashboard/admin/overview');

/** Fetches timetable classes scheduled across rooms and trainers. */
export const getUpcomingClasses = (params) => apiClient('/dashboard/admin/upcoming-classes', { params });

/** Checks real-time room and instructor scheduling conflicts. */
export const getConflicts = () => apiClient('/dashboard/admin/conflicts');

/** Retrieves operational alerts (e.g. unassigned sessions, attendance gaps). */
export const getAlerts = () => apiClient('/dashboard/admin/alerts');

/** Dismisses or acknowledges an operational alert. */
export const acknowledgeAlert = (alertId) =>
  apiClient(`/dashboard/admin/alerts/${alertId}/acknowledge`, { method: 'POST' });

/** Creates a new class session with room/trainer conflict validation. */
export const createSchedule = (payload) =>
  apiClient('/dashboard/admin/schedules', { method: 'POST', body: payload });

/** Updates a scheduled class session timing, room, or faculty. */
export const updateSchedule = (scheduleId, payload) =>
  apiClient(`/dashboard/admin/schedules/${scheduleId}`, { method: 'PATCH', body: payload });

/** Cancels or deletes a scheduled class session. */
export const deleteSchedule = (scheduleId) =>
  apiClient(`/dashboard/admin/schedules/${scheduleId}`, { method: 'DELETE' });


// ===========================================================================
// 2. Owner / Executive Stats
// ===========================================================================

/** High-level executive statistics for the institute owner/director. */
export const getOwnerStats = () => apiClient('/dashboard/owner/stats');


// ===========================================================================
// 3. Counselor Operations APIs (Enquiries, Admissions, Follow-up Reminders)
// ===========================================================================

/** Retrieves pipeline counts, conversion rate, pending follow-ups, and admissions for the counselor. */
export const getCounselorSummary = () => apiClient('/counselor/summary');

/** Searches and filters enquiries assigned to the current counselor. */
export const getCounselorEnquiries = (params) => apiClient('/counselor/enquiries', { params });

/** Registers a new student lead or enquiry. */
export const createCounselorEnquiry = (payload) =>
  apiClient('/counselor/enquiries', { method: 'POST', body: payload });

/** Retrieves detailed profile, notes, and interaction history for an enquiry. */
export const getCounselorEnquiryDetail = (id) => apiClient(`/counselor/enquiries/${id}`);

/** Updates enquiry lead status, priority, or contact details. */
export const updateCounselorEnquiry = (id, payload) =>
  apiClient(`/counselor/enquiries/${id}`, { method: 'PATCH', body: payload });

/** Logs a call, meeting, or email interaction with an enquiry. */
export const recordCounselorInteraction = (id, payload) =>
  apiClient(`/counselor/enquiries/${id}/interactions`, { method: 'POST', body: payload });

/** Converts an enquiry into a student admission record. */
export const convertCounselorEnquiry = (id, payload) =>
  apiClient(`/counselor/enquiries/${id}/convert`, { method: 'POST', body: payload });

/** Lists students assigned to this counselor. */
export const getCounselorStudents = (params) => apiClient('/counselor/students', { params });

/** Gets detailed counselor profile for an admitted student. */
export const getCounselorStudentDetail = (id) => apiClient(`/counselor/students/${id}`);

/** Lists scheduled follow-up tasks and reminders. */
export const getCounselorFollowUps = (params) => apiClient('/counselor/follow-ups', { params });

/** Creates a scheduled reminder or callback task. */
export const createCounselorFollowUp = (payload) =>
  apiClient('/counselor/follow-ups', { method: 'POST', body: payload });

/** Updates follow-up task details. */
export const updateCounselorFollowUp = (id, payload) =>
  apiClient(`/counselor/follow-ups/${id}`, { method: 'PATCH', body: payload });

/** Marks a follow-up task as complete with outcome notes. */
export const completeCounselorFollowUp = (id, payload) =>
  apiClient(`/counselor/follow-ups/${id}/complete`, { method: 'POST', body: payload });

/** Reschedules an overdue or pending follow-up task. */
export const rescheduleCounselorFollowUp = (id, payload) =>
  apiClient(`/counselor/follow-ups/${id}/reschedule`, { method: 'POST', body: payload });

/** Lists admissions in progress or awaiting administrative approval. */
export const getCounselorAdmissions = (params) => apiClient('/counselor/admissions', { params });

/** Retrieves single admission details. */
export const getCounselorAdmissionDetail = (id) => apiClient(`/counselor/admissions/${id}`);

/** Updates admission stage (e.g. document verification, fee agreement). */
export const updateCounselorAdmissionStage = (id, payload) =>
  apiClient(`/counselor/admissions/${id}`, { method: 'PATCH', body: payload });

/** Submits an admission file for Admin/SuperAdmin approval. */
export const submitCounselorAdmissionApproval = (id, payload) =>
  apiClient(`/counselor/admissions/${id}/submit-approval`, { method: 'POST', body: payload });

/** Quick priority actions requiring counselor attention today. */
export const getCounselorNextActions = () => apiClient('/counselor/next-actions');


// ===========================================================================
// 4. Trainer Dashboard APIs (Academic Schedule, Attendance, Student Accounts)
// CRITICAL: Trainer responses NEVER contain fee, payment, or financial records.
// ===========================================================================

/** Fetches today's classes, assigned batches, and attendance pending counts for faculty. */
export const getTrainerOverview = () => apiClient('/trainer/overview');

/** Fetches timezone-aware timetable for the trainer's assigned cohorts. */
export const getTrainerSchedule = (params) => apiClient('/trainer/schedule', { params });

/** Lists all cohorts instructed by this trainer. */
export const getTrainerBatches = () => apiClient('/trainer/batches');

/** Gets details for a single batch assigned to this trainer. */
export const getTrainerBatchDetail = (batchId) => apiClient(`/trainer/batches/${batchId}`);

/** Lists students enrolled in a trainer's batch with academic and account status (no fee data). */
export const getTrainerBatchStudents = (batchId, params) =>
  apiClient(`/trainer/batches/${batchId}/students`, { params });

/** Loads session roster and current attendance states for a class session. */
export const getTrainerSessionAttendance = (sessionId) =>
  apiClient(`/trainer/sessions/${sessionId}/attendance`);

/** Transactionally saves or updates attendance for assigned students (Present/Absent/Late). */
export const submitTrainerAttendance = (payload) =>
  apiClient('/trainer/attendance', { method: 'POST', body: payload });

/** Filterable audit history of marked attendance records. */
export const getTrainerAttendanceHistory = (params) =>
  apiClient('/trainer/attendance/history', { params });

/** Downloads a streaming CSV export of batch attendance history. */
export const exportTrainerAttendanceCsv = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  const token = localStorage.getItem('access_token');
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  const url = `${BASE_URL}/trainer/attendance/export${query ? `?${query}` : ''}`;
  const resp = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(errorText || 'Failed to download attendance CSV');
  }
  const blob = await resp.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `trainer_attendance_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

/** Retrieves academic indicators and faculty observations for an assigned student. */
export const getTrainerStudentProgress = (studentId) =>
  apiClient(`/trainer/students/${studentId}/progress`);

/** Logs a faculty observation note for an assigned student. */
export const addAcademicObservation = (studentId, payload) =>
  apiClient(`/trainer/students/${studentId}/observations`, { method: 'POST', body: payload });

/** Checks if a student account exists, is active, or pending activation. */
export const getStudentAccountStatus = (studentId) =>
  apiClient(`/trainer/students/${studentId}/account`);

/** Provisions a student login account and generates a single-use 48h activation link. */
export const createStudentAccount = (studentId) =>
  apiClient(`/trainer/students/${studentId}/account`, { method: 'POST' });

/** Regenerates a fresh activation token for expired or unactivated student accounts. */
export const regenerateStudentActivation = (studentId) =>
  apiClient(`/trainer/students/${studentId}/account/regenerate-token`, { method: 'POST' });

/** Public endpoint: Student completes activation by setting their password. */
export const activateStudentAccount = (payload) =>
  apiClient('/auth/activate-student', { method: 'POST', body: payload });

/** Public endpoint: Validates token validity before rendering password form. */
export const verifyActivationToken = (token) =>
  apiClient(`/auth/verify-activation?token=${encodeURIComponent(token)}`);


// ===========================================================================
// 5. Accounts & Finance APIs (Collections, EMIs, Receipts, Reconciliation)
// ===========================================================================

/** High-level financial overview: collected, pending, overdue EMIs, payment methods, and trends. */
export const getFinanceOverview = (params) => apiClient('/finance/overview', { params });
export const getAccountsOverview = getFinanceOverview;

/** Lists fee installment plans with status filters (Paid, Pending, Overdue). */
export const getFinanceFees = (params) => apiClient('/finance/fees', { params });

/** Enrolled student directory with fee installment structures. */
export const getFinanceStudents = () => apiClient('/finance/students');

/** Searchable payment transaction ledger with receipt and reference matching. */
export const getFinancePayments = (params) => apiClient('/finance/payments', { params });

/** Records an official student fee payment, auto-allocating to pending installments. */
export const recordFinancePayment = (payload) =>
  apiClient('/finance/payments', { method: 'POST', body: payload });

/** Generates official receipt details for printing or PDF view. */
export const getFinanceReceipt = (paymentId) => apiClient(`/finance/payments/${paymentId}/receipt`);

/** Summary of reconciled vs unreconciled transactions and flagged discrepancies. */
export const getFinanceReconciliationSummary = () => apiClient('/finance/reconciliation/summary');

/** Marks a bank transfer/UPI payment as verified and reconciled. */
export const reconcileFinancePayment = (paymentId) =>
  apiClient(`/finance/reconciliation/${paymentId}/reconcile`, { method: 'POST' });

/** Flags a payment with a discrepancy (e.g. wrong amount, unverified bank reference). */
export const flagFinanceDiscrepancy = (paymentId, payload) =>
  apiClient(`/finance/reconciliation/${paymentId}/flag-discrepancy`, { method: 'POST', body: payload });

/** Fetches structured financial reports (fee_collection, outstanding_fees, overdue_emis, upcoming_dues). */
export const getFinanceReport = (reportType, params) =>
  apiClient(`/finance/reports/${reportType}`, { params });

/** Streams financial audit reports as downloadable CSV files. */
export const exportFinanceReportCsv = async (reportType, params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  const token = localStorage.getItem('access_token');
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  const url = `${BASE_URL}/finance/reports/${reportType}/export${query ? `?${query}` : ''}`;
  const resp = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(errorText || 'Failed to download report CSV');
  }
  const blob = await resp.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${reportType}_report.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
};


// ===========================================================================
// 6. Student Portal APIs
// ===========================================================================

/** Retrieves the authenticated student's personal profile and enrolled courses. */
export const getStudentProfile = () => apiClient('/dashboard/student/profile');


// ===========================================================================
// 7. Backward Compatibility & Legacy Aliases
// ===========================================================================

export const getStats = getAdminOverview;
export const getRecentActivity = () => apiClient('/dashboard/recent-activity');

/** Unified dashboardApi object for backward compatibility across existing views. */
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
  getTrainerOverview,
  getTrainerSchedule,
  getTrainerBatches,
  getTrainerBatchDetail,
  getTrainerBatchStudents,
  getTrainerSessionAttendance,
  submitTrainerAttendance,
  getTrainerAttendanceHistory,
  exportTrainerAttendanceCsv,
  getTrainerStudentProgress,
  addAcademicObservation,
  getStudentAccountStatus,
  createStudentAccount,
  regenerateStudentActivation,
  activateStudentAccount,
  verifyActivationToken,
  // Accounts / Finance
  getAccountsOverview,
  getFinanceOverview,
  getFinanceFees,
  getFinanceStudents,
  getFinancePayments,
  recordFinancePayment,
  getFinanceReceipt,
  getFinanceReconciliationSummary,
  reconcileFinancePayment,
  flagFinanceDiscrepancy,
  getFinanceReport,
  exportFinanceReportCsv,
  // Student
  getStudentProfile,
  // Legacy
  getStats,
  getRecentActivity,
};

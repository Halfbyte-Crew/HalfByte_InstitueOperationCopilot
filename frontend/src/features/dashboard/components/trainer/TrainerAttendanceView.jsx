import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Check,
  Users,
} from 'lucide-react';
import {
  getTrainerBatches,
  getTrainerBatchStudents,
  submitTrainerAttendance,
  getTrainerAttendanceHistory,
} from '../../dashboardApi';
import { EmptyState } from '../../../../components/common/EmptyState';

export function TrainerAttendanceView({ preselectedSession }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(preselectedSession?.batch_id || '');
  const [sessionDate, setSessionDate] = useState(
    preselectedSession?.scheduled_date || new Date().toISOString().slice(0, 10)
  );

  const [studentRows, setStudentRows] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (preselectedSession?.batch_id) {
      setSelectedBatchId(preselectedSession.batch_id);
    }
    if (preselectedSession?.scheduled_date) {
      setSessionDate(preselectedSession.scheduled_date);
    }
  }, [preselectedSession]);

  useEffect(() => {
    if (selectedBatchId && sessionDate) {
      loadStudentsAndExistingAttendance(selectedBatchId, sessionDate);
    }
  }, [selectedBatchId, sessionDate]);

  const loadBatches = async () => {
    try {
      const data = await getTrainerBatches();
      const list = data?.batches || [];
      setBatches(list);
      if (list.length > 0 && !selectedBatchId) {
        setSelectedBatchId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    }
  };

  const loadStudentsAndExistingAttendance = async (batchId, dateVal) => {
    setIsLoadingStudents(true);
    setStatusMessage(null);
    try {
      // 1. Fetch students enrolled in this batch
      const studentsRes = await getTrainerBatchStudents(batchId);
      const students = studentsRes?.students || [];

      // 2. Fetch existing attendance records for this batch & date
      const historyRes = await getTrainerAttendanceHistory({
        batch_id: batchId,
        from_date: dateVal,
        to_date: dateVal,
        limit: 200,
      });
      const existingMap = {};
      (historyRes?.records || []).forEach((r) => {
        existingMap[r.student_id] = r;
      });

      // 3. Assemble attendance sheet
      const rows = students.map((stu) => {
        const existing = existingMap[stu.id];
        return {
          student_id: stu.id,
          name: stu.name,
          email: stu.email,
          status: existing ? existing.status : 'Present', // default to Present
          remarks: existing?.remarks || '',
          hasExisting: !!existing,
        };
      });

      setStudentRows(rows);
    } catch (err) {
      console.error('Failed to load attendance sheet:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load student worksheet.' });
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    setStudentRows((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status: newStatus } : r))
    );
  };

  const handleRemarksChange = (studentId, remarks) => {
    setStudentRows((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, remarks } : r))
    );
  };

  const handleMarkAll = (targetStatus) => {
    setStudentRows((prev) => prev.map((r) => ({ ...r, status: targetStatus })));
  };

  const handleConfirmSubmit = async () => {
    setConfirmModalOpen(false);
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        batch_id: selectedBatchId,
        session_date: sessionDate,
        entries: studentRows.map((r) => ({
          student_id: r.student_id,
          status: r.status,
          remarks: r.remarks?.trim() || null,
        })),
      };

      const result = await submitTrainerAttendance(payload);
      setStatusMessage({
        type: 'success',
        text: `Attendance saved successfully: ${result.submitted} recorded, ${result.updated} updated for ${result.batch_code} on ${result.session_date}.`,
      });

      // Reload fresh state
      await loadStudentsAndExistingAttendance(selectedBatchId, sessionDate);
    } catch (err) {
      console.error('Attendance submission failed:', err);
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.detail || err.message || 'Failed to submit attendance.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const presentCount = studentRows.filter((r) => r.status === 'Present').length;
  const absentCount = studentRows.filter((r) => r.status === 'Absent').length;
  const lateCount = studentRows.filter((r) => r.status === 'Late').length;

  return (
    <div className="space-y-6">
      {/* Session Header & Date Selector */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Select Batch
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.course_title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Session Date
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>

            {preselectedSession?.title && (
              <div className="self-end pb-1 text-xs text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 font-medium">
                Target Session: {preselectedSession.title}
              </div>
            )}
          </div>

          {/* Quick Mark Toggles */}
          {studentRows.length > 0 && (
            <div className="flex items-center gap-2 self-start md:self-end">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Quick Mark:
              </span>
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
              >
                All Absent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Attendance Worksheet */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Attendance Worksheet — {selectedBatch?.code || 'Cohort'}
            </h3>
            <p className="text-2xs text-slate-500">
              Date: {sessionDate} • {studentRows.length} Enrolled Scholars
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              Present: {presentCount}
            </span>
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
              Absent: {absentCount}
            </span>
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
              Late: {lateCount}
            </span>
          </div>
        </div>

        {isLoadingStudents ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading student roster...</div>
        ) : studentRows.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No students enrolled in this cohort"
              description="Select an active batch with enrolled students to mark session attendance."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-2xs">
                  <th className="px-6 py-3">Student Scholar</th>
                  <th className="px-4 py-3">Attendance Status</th>
                  <th className="px-6 py-3">Session Notes / Academic Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentRows.map((row) => (
                  <tr key={row.student_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{row.name}</div>
                      <div className="text-2xs text-slate-400 font-mono">{row.email}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        {['Present', 'Absent', 'Late', 'Excused'].map((st) => {
                          const isSelected = row.status === st;
                          let selectedColor = 'bg-white shadow-xs ';
                          if (st === 'Present') selectedColor += 'text-emerald-700 font-bold';
                          else if (st === 'Absent') selectedColor += 'text-rose-700 font-bold';
                          else if (st === 'Late') selectedColor += 'text-amber-700 font-bold';
                          else selectedColor += 'text-slate-700 font-bold';

                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(row.student_id, st)}
                              className={`px-3 py-1 rounded-md text-xs transition-all ${
                                isSelected ? selectedColor : 'text-slate-500 hover:text-slate-900'
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      <input
                        type="text"
                        placeholder="Optional remarks (e.g., active participation, joined 10m late)..."
                        value={row.remarks}
                        onChange={(e) => handleRemarksChange(row.student_id, e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {studentRows.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <p className="text-2xs text-slate-500">
              Changes will be committed transactionally with faculty signature and audit timestamp.
            </p>
            <button
              type="button"
              disabled={isSubmitting || isLoadingStudents}
              onClick={() => setConfirmModalOpen(true)}
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving Attendance...' : 'Submit Attendance'}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Confirm Attendance Submission</h3>
                <p className="text-xs text-slate-500">
                  {selectedBatch?.code} • {sessionDate}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Present Scholars:</span>
                <span className="font-bold text-emerald-700">{presentCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Absent Scholars:</span>
                <span className="font-bold text-rose-700">{absentCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Late Scholars:</span>
                <span className="font-bold text-amber-700">{lateCount}</span>
              </div>
            </div>

            <p className="text-2xs text-slate-500">
              Submitting will update the official attendance ledger. Existing records for this
              session date will be updated without duplicates.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Review Again
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

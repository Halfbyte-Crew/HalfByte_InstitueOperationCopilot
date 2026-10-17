import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  BookOpen,
  Info,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import {
  getTrainerBatches,
  getTrainerBatchStudents,
  getTrainerStudentProgress,
} from '../../dashboardApi';
import { AcademicObservationModal } from './AcademicObservationModal';
import { StudentAccountModal } from './StudentAccountModal';
import { EmptyState } from '../../../../components/common/EmptyState';

export function TrainerStudentProgressView({ preselectedStudentId, preselectedBatchId }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(preselectedBatchId || '');
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || '');

  const [progressData, setProgressData] = useState(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadStudents(selectedBatchId);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentProgress(selectedStudentId);
    } else {
      setProgressData(null);
    }
  }, [selectedStudentId]);

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

  const loadStudents = async (batchId) => {
    try {
      const data = await getTrainerBatchStudents(batchId);
      const list = data?.students || [];
      setStudents(list);
      if (list.length > 0 && (!selectedStudentId || !list.some((s) => s.id === selectedStudentId))) {
        setSelectedStudentId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const loadStudentProgress = async (studentId) => {
    setIsLoadingProgress(true);
    setError(null);
    try {
      const data = await getTrainerStudentProgress(studentId);
      setProgressData(data);
    } catch (err) {
      console.error('Failed to load academic progress:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load student progress');
    } finally {
      setIsLoadingProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector Strip */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
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
              Select Scholar
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold min-w-[200px]"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoadingProgress ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading academic profile...
        </div>
      ) : !progressData ? (
        <div className="p-12 bg-white rounded-xl border border-slate-200">
          <EmptyState
            title="Select a student to view academic progress"
            description="Choose a student scholar from your assigned cohorts above."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Student Profile Card Header */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{progressData.student_name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {progressData.enrollment_status}
                </span>
                <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-700">
                  {progressData.batch_code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {progressData.student_email} • {progressData.course_title}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsObsModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Observation
              </button>

              <button
                type="button"
                onClick={() => setIsAccountModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                Account: {progressData.account_status}
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Attendance Rate
              </span>
              <p className="text-2xl font-bold text-emerald-600">{progressData.attendance_rate}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Sessions Attended
              </span>
              <p className="text-2xl font-bold text-slate-900">{progressData.sessions_attended}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Sessions Missed
              </span>
              <p className="text-2xl font-bold text-rose-600">{progressData.sessions_missed}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Late Arrivals
              </span>
              <p className="text-2xl font-bold text-amber-600">{progressData.sessions_late}</p>
            </div>
          </div>

          {/* Observations & Recent Attendance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Faculty Academic Observations */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-slate-900 text-sm">Faculty Academic Observations</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsObsModalOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + Add Note
                </button>
              </div>

              {progressData.observations?.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No academic feedback recorded yet for this scholar.
                </div>
              ) : (
                <div className="space-y-3">
                  {progressData.observations.map((obs) => (
                    <div
                      key={obs.id}
                      className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-2xs">
                        <span className="font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {obs.observation_type}
                        </span>
                        <span className="text-slate-400">
                          {new Date(obs.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed">{obs.note}</p>
                      <p className="text-2xs text-slate-400 italic">
                        Logged by {obs.trainer_name} ({obs.trainer_email})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Attendance Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm">Recent Attendance History</h4>
              </div>

              {progressData.recent_attendance?.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No session attendance recorded yet for this cohort.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {progressData.recent_attendance.map((att) => (
                    <div
                      key={att.record_id}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-medium text-slate-900">
                          {new Date(att.session_date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {att.remarks && (
                          <p className="text-2xs text-slate-400 italic mt-0.5">{att.remarks}</p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
                          att.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700'
                            : att.status === 'Absent'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Unsupported Features Disclosure Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Curriculum Tracking Notice: </span>
              {progressData.unsupported_features_note ||
                'LMS assignments, external assessments, and module-level grading are not currently configured in this institute database.'}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {progressData && (
        <>
          <AcademicObservationModal
            isOpen={isObsModalOpen}
            onClose={() => setIsObsModalOpen(false)}
            student={{ id: progressData.student_id, name: progressData.student_name }}
            batchId={selectedBatchId}
            onObservationAdded={() => loadStudentProgress(progressData.student_id)}
          />

          <StudentAccountModal
            isOpen={isAccountModalOpen}
            onClose={() => setIsAccountModalOpen(false)}
            student={{
              id: progressData.student_id,
              name: progressData.student_name,
              email: progressData.student_email,
              phone: progressData.student_phone,
            }}
            onAccountCreated={() => loadStudentProgress(progressData.student_id)}
          />
        </>
      )}
    </div>
  );
}

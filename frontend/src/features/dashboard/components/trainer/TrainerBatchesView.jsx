import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CalendarDays,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  TrendingUp,
  ClipboardCheck,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { getTrainerBatches, getTrainerBatchStudents } from '../../dashboardApi';
import { EmptyState } from '../../../../components/common/EmptyState';

const BATCH_STATUS_STYLE = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Upcoming: 'bg-sky-50 text-sky-700 border-sky-200',
  Completed: 'bg-slate-50 text-slate-600 border-slate-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function TrainerBatchesView({
  onSelectStudentForAccount,
  onSelectStudentForProgress,
  onNavigateTab,
}) {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [studentsData, setStudentsData] = useState({ students: [], total: 0 });
  const [search, setSearch] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState('');
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadStudents(selectedBatchId);
    }
  }, [selectedBatchId, search, accountStatusFilter]);

  const loadBatches = async () => {
    setIsLoadingBatches(true);
    setError(null);
    try {
      const data = await getTrainerBatches();
      const list = data?.batches || [];
      setBatches(list);
      if (list.length > 0 && !selectedBatchId) {
        setSelectedBatchId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load batches');
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const loadStudents = async (batchId) => {
    setIsLoadingStudents(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (accountStatusFilter) params.account_status = accountStatusFilter;

      const data = await getTrainerBatchStudents(batchId, params);
      setStudentsData(data || { students: [], total: 0 });
    } catch (err) {
      console.error('Failed to load students in batch:', err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  return (
    <div className="space-y-6">
      {/* Batches Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoadingBatches ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))
        ) : batches.length === 0 ? (
          <div className="col-span-full p-8 bg-white rounded-xl border border-slate-200">
            <EmptyState
              title="No batches assigned"
              description="You have not been assigned to instruct any student cohorts yet."
            />
          </div>
        ) : (
          batches.map((batch) => {
            const isSelected = batch.id === selectedBatchId;
            const statusStyle =
              BATCH_STATUS_STYLE[batch.status] || 'bg-slate-50 text-slate-600 border-slate-200';

            return (
              <button
                key={batch.id}
                type="button"
                onClick={() => setSelectedBatchId(batch.id)}
                className={`p-4 rounded-xl border text-left transition-all shadow-2xs ${
                  isSelected
                    ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded">
                      {batch.code}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1.5 line-clamp-1">
                      {batch.course_title}
                    </h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-2xs font-semibold border ${statusStyle}`}
                  >
                    {batch.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {batch.enrolled_students} Students
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    {batch.attendance_rate_overall} Attendance
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Selected Batch Details & Student Roster */}
      {selectedBatch && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Header & Filter Controls */}
          <div className="p-6 border-b border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedBatch.code} — {selectedBatch.course_title}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    ({selectedBatch.course_code})
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cohort Roster & Student Account Authentication Control
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('attendance')}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  Mark Batch Attendance
                </button>
              </div>
            </div>

            {/* Search and Account Status Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">
                  Account Status:
                </label>
                <select
                  value={accountStatusFilter}
                  onChange={(e) => setAccountStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">All Account States</option>
                  <option value="active">Active Login</option>
                  <option value="pending_activation">Pending Activation</option>
                  <option value="not_created">Not Created</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-2xs">
                  <th className="px-6 py-3">Student Scholar</th>
                  <th className="px-4 py-3">Academic Status</th>
                  <th className="px-4 py-3">Attendance Rate</th>
                  <th className="px-4 py-3">Attended / Missed</th>
                  <th className="px-4 py-3">Login Account</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingStudents ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Loading student roster...
                    </td>
                  </tr>
                ) : studentsData.students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <EmptyState
                        title="No students found in this cohort"
                        description="No students match the specified search or filter criteria."
                      />
                    </td>
                  </tr>
                ) : (
                  studentsData.students.map((student) => {
                    const status = student.account_status;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-slate-900">{student.name}</div>
                          <div className="text-2xs text-slate-400 font-mono mt-0.5">
                            {student.email}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-700">
                            {student.student_status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{student.attendance_rate}</div>
                        </td>

                        <td className="px-4 py-3.5 text-slate-600">
                          <span className="text-emerald-700 font-semibold">
                            {student.classes_attended} attended
                          </span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-rose-600">{student.classes_missed} missed</span>
                        </td>

                        <td className="px-4 py-3.5">
                          {status === 'active' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" />
                              Active
                            </span>
                          )}
                          {status === 'pending_activation' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Pending Setup
                            </span>
                          )}
                          {status === 'not_created' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <AlertCircle className="w-3 h-3" />
                              Not Provisioned
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-3.5 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => onSelectStudentForAccount(student)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            {status === 'not_created' ? 'Create Account' : 'Manage Account'}
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectStudentForProgress(student, selectedBatch.id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <TrendingUp className="w-3 h-3" />
                            Progress
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

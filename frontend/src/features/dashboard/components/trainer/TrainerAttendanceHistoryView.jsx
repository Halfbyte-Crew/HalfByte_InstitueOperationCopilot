import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Filter,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  getTrainerAttendanceHistory,
  getTrainerBatches,
  exportTrainerAttendanceCsv,
} from '../../dashboardApi';
import { EmptyState } from '../../../../components/common/EmptyState';

const STATUS_BADGE = {
  Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Absent: 'bg-rose-50 text-rose-700 border-rose-200',
  Late: 'bg-amber-50 text-amber-700 border-amber-200',
  Excused: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function TrainerAttendanceHistoryView() {
  const [batches, setBatches] = useState([]);
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [selectedBatch, setSelectedBatch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [selectedBatch, statusFilter, fromDate, toDate]);

  const loadBatches = async () => {
    try {
      const data = await getTrainerBatches();
      setBatches(data?.batches || []);
    } catch (err) {
      console.error('Failed to load batches:', err);
    }
  };

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { limit: 100 };
      if (selectedBatch) params.batch_id = selectedBatch;
      if (statusFilter) params.attendance_status = statusFilter;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const data = await getTrainerAttendanceHistory(params);
      setRecords(data?.records || []);
      setTotalCount(data?.total || 0);
    } catch (err) {
      console.error('Failed to load attendance history:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load attendance history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = {};
      if (selectedBatch) params.batch_id = selectedBatch;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      await exportTrainerAttendanceCsv(params);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to download attendance CSV: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Strip */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Batch
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">All Assigned Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.course_title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Excused">Excused</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {(selectedBatch || statusFilter || fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBatch('');
                  setStatusFilter('');
                  setFromDate('');
                  setToDate('');
                }}
                className="self-end px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-start md:self-end">
            <button
              type="button"
              onClick={loadHistory}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              type="button"
              disabled={isExporting || records.length === 0}
              onClick={handleExportCsv}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Attendance Audit Ledger</h3>
          <span className="text-xs font-semibold text-slate-500">
            {totalCount} Total Audit {totalCount === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-2xs">
                <th className="px-6 py-3">Session Date</th>
                <th className="px-4 py-3">Batch & Course</th>
                <th className="px-4 py-3">Student Scholar</th>
                <th className="px-4 py-3">Attendance Status</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-6 py-3 text-right">Recorded Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading attendance history...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <EmptyState
                      title="No attendance records match your criteria"
                      description="Try adjusting your filters or date range."
                    />
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const badgeClass =
                    STATUS_BADGE[r.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr key={r.record_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        {new Date(r.session_date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mr-1.5">
                          {r.batch_code}
                        </span>
                        <span className="text-slate-600 truncate max-w-[140px] inline-block align-middle">
                          {r.course_title}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{r.student_name}</div>
                        <div className="text-2xs text-slate-400 font-mono">{r.student_email}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold border ${badgeClass}`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 italic">
                        {r.remarks || '—'}
                      </td>

                      <td className="px-6 py-3.5 text-right font-mono text-2xs text-slate-400">
                        {r.recorded_at ? new Date(r.recorded_at).toLocaleString('en-IN') : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

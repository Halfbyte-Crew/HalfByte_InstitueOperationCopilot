import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { getTrainerSchedule, getTrainerBatches } from '../../dashboardApi';
import { EmptyState } from '../../../../components/common/EmptyState';

export function TrainerScheduleView({ onSelectSessionForAttendance }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [scheduleData, setScheduleData] = useState({ todays_sessions: [], upcoming_sessions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [selectedBatch, fromDate, toDate]);

  const loadBatches = async () => {
    try {
      const data = await getTrainerBatches();
      setBatches(data?.batches || []);
    } catch (err) {
      console.error('Failed to load batches for schedule filter:', err);
    }
  };

  const loadSchedule = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedBatch) params.batch_id = selectedBatch;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const data = await getTrainerSchedule(params);
      setScheduleData(data || { todays_sessions: [], upcoming_sessions: [] });
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const allSessions = [
    ...(scheduleData.todays_sessions || []),
    ...(scheduleData.upcoming_sessions || []),
  ];

  return (
    <div className="space-y-6">
      {/* Filters Strip */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Assigned Batch
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

            {(selectedBatch || fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBatch('');
                  setFromDate('');
                  setToDate('');
                }}
                className="self-end px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={loadSchedule}
            className="self-start md:self-end px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Schedule Sessions Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Instructional Class Timetable</h3>
            <p className="text-2xs text-slate-500 mt-0.5">
              Operating on Institute Configured Timezone (Asia/Kolkata)
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {allSessions.length} {allSessions.length === 1 ? 'Session' : 'Sessions'} Scheduled
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : allSessions.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No class sessions match your filters"
              description="No classes match your selected batch or date criteria. Try adjusting filters or select another batch."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allSessions.map((session) => {
              const isToday =
                session.scheduled_date === new Date().toISOString().slice(0, 10);
              const isOnline = session.delivery_mode === 'Online' || !!session.meeting_link;
              const isSubmitted = session.attendance_submitted;

              return (
                <div
                  key={session.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {session.batch_code}
                      </span>
                      <span className="text-xs text-slate-500">{session.course_title}</span>
                      {isToday && (
                        <span className="px-2 py-0.5 text-2xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                          Today
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold ${
                          isOnline
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {isOnline ? 'Online' : 'Campus Offline'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{session.title}</h4>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {new Date(session.scheduled_date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {session.start_time} – {session.end_time}
                      </span>
                      {session.classroom && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {session.classroom}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {session.enrolled_count} Scholars
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isSubmitted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    )}

                    {session.meeting_link && (
                      <a
                        href={session.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Video className="w-3.5 h-3.5" /> Link
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectSessionForAttendance(session)}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      {isSubmitted ? 'Edit Attendance' : 'Mark Attendance'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

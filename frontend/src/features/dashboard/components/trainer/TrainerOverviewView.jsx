import React from 'react';
import {
  CalendarDays,
  Users,
  ClipboardCheck,
  Clock,
  BookOpen,
  MapPin,
  Video,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { EmptyState } from '../../../../components/common/EmptyState';

export function TrainerOverviewView({
  overview,
  schedule,
  isLoading,
  onNavigateTab,
  onSelectSessionForAttendance,
}) {
  const todaysSessions = schedule?.todays_sessions || [];
  const upcomingSessions = schedule?.upcoming_sessions || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            label: "Today's Classes",
            value: overview?.todays_sessions ?? 0,
            icon: Clock,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'hover:border-indigo-200',
            onClick: () => onNavigateTab('schedule'),
          },
          {
            label: 'Attendance Pending',
            value: overview?.attendance_pending_today ?? 0,
            icon: AlertCircle,
            color: overview?.attendance_pending_today > 0 ? 'text-amber-600' : 'text-slate-400',
            bg: overview?.attendance_pending_today > 0 ? 'bg-amber-50' : 'bg-slate-50',
            border: 'hover:border-amber-200',
            onClick: () => onNavigateTab('attendance'),
          },
          {
            label: 'Assigned Batches',
            value: overview?.assigned_batches ?? 0,
            icon: BookOpen,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'hover:border-blue-200',
            onClick: () => onNavigateTab('batches'),
          },
          {
            label: 'Active Cohorts',
            value: overview?.active_batches ?? 0,
            icon: CalendarDays,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'hover:border-emerald-200',
            onClick: () => onNavigateTab('batches'),
          },
          {
            label: 'Total Students',
            value: overview?.total_students ?? 0,
            icon: Users,
            color: 'text-teal-600',
            bg: 'bg-teal-50',
            border: 'hover:border-teal-200',
            onClick: () => onNavigateTab('batches'),
          },
          {
            label: 'Upcoming (7d)',
            value: overview?.upcoming_sessions_7d ?? 0,
            icon: Clock,
            color: 'text-sky-600',
            bg: 'bg-sky-50',
            border: 'hover:border-sky-200',
            onClick: () => onNavigateTab('schedule'),
          },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <button
              key={k.label}
              type="button"
              onClick={k.onClick}
              className={`p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-left transition-all hover:shadow-xs ${k.border} group`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">
                  {k.label}
                </span>
                <div className={`p-2 rounded-lg ${k.bg} ${k.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {isLoading ? '—' : k.value}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Today's Classes & Upcoming Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Scheduled Classes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Today's Class Schedule</h3>
            </div>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Full Schedule <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todaysSessions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <EmptyState
                title="No classes scheduled today"
                description="You have no instructional sessions scheduled for today. Review upcoming classes or prepare batch materials."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {todaysSessions.map((session) => {
                const isOnline = session.delivery_mode === 'Online' || !!session.meeting_link;
                const isSubmitted = session.attendance_submitted;

                return (
                  <div
                    key={session.id}
                    className="p-5 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-200 hover:shadow-xs transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {session.batch_code}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {session.course_title}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold ${
                              isOnline
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {isOnline ? 'Online Class' : 'Campus Offline'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">
                          {session.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
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
                            {session.enrolled_count} Enrolled Students
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Attendance Recorded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Attendance Pending
                          </span>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          {session.meeting_link && (
                            <a
                              href={session.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Video className="w-3.5 h-3.5" /> Meeting Link
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectSessionForAttendance(session)}
                            className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            {isSubmitted ? 'Edit Attendance' : 'Mark Attendance'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Upcoming Classes in Chronological Order */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Upcoming Classes</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
            {upcomingSessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No upcoming sessions scheduled for next 7 days.
              </div>
            ) : (
              upcomingSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center justify-between text-2xs font-semibold text-slate-400 mb-1">
                    <span className="font-mono text-indigo-600">{session.batch_code}</span>
                    <span>
                      {new Date(session.scheduled_date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h5 className="font-semibold text-slate-900 text-xs line-clamp-1">
                    {session.title}
                  </h5>
                  <div className="flex items-center justify-between text-2xs text-slate-500 mt-1.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {session.start_time} – {session.end_time}
                    </span>
                    <span>{session.classroom || (session.meeting_link ? 'Online' : 'Campus')}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Academic Operations Links */}
          <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-2">
            <h5 className="text-xs font-bold text-indigo-900">Faculty Academic Operations</h5>
            <p className="text-2xs text-indigo-700 leading-relaxed">
              Maintain daily attendance audit trails and provision student accounts so cohort
              scholars can securely access their curriculum.
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('batches')}
                className="px-2.5 py-1 text-2xs font-semibold bg-white text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-50"
              >
                View My Batches
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('history')}
                className="px-2.5 py-1 text-2xs font-semibold bg-white text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-50"
              >
                Attendance Audit Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

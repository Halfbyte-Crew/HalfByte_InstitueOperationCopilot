import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { BookOpen, CalendarDays, ClipboardCheck, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import { dashboardApi } from '../dashboardApi';
import { useAuth } from '../../../app/providers';

export function StudentDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error } = useApi(dashboardApi.getStudentProfile);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name ?? 'Student'}`}
        description="Your enrolled courses, schedule, attendance, and personal information."
      />

      {/* Demo mode banner */}
      <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <span className="shrink-0 mt-0.5">⚠</span>
        <span>
          <strong>Phase 3 Demo Mode:</strong> Full student portal requires Phase 4 user-to-student record
          linking. The data shown below is institute-level until your personal record is linked.
        </span>
      </div>

      {error && <ErrorMessage message={error} className="mb-6" />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {[
          { label: 'Enrolled Courses', value: isLoading ? '—' : data?.enrolled_courses ?? '—', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active Batches', value: isLoading ? '—' : data?.active_batches ?? '—', icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Attendance', value: '—', icon: ClipboardCheck, color: 'text-sky-600', bg: 'bg-sky-50' },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-8 bg-slate-100 rounded w-1/3" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{k.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{k.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${k.bg} ${k.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming Schedule — demo placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Upcoming Classes</h2>
            <Badge variant="warning">Demo Data</Badge>
          </div>
          <div className="space-y-3">
            {[
              { subject: 'Python Full Stack', time: 'Today, 10:00 AM', batch: 'Batch A' },
              { subject: 'Database Design', time: 'Tomorrow, 2:00 PM', batch: 'Batch A' },
              { subject: 'React Fundamentals', time: 'Wed, 11:00 AM', batch: 'Batch B' },
            ].map((cls) => (
              <div key={cls.subject} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-800">{cls.subject}</p>
                  <p className="text-xs text-slate-500">{cls.batch}</p>
                </div>
                <span className="text-xs text-indigo-600 font-medium">{cls.time}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">Real schedule requires Phase 4 timetable linking.</p>
        </div>

        {/* Fee schedule — demo placeholder, no real payment data shown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Fee Schedule</h2>
            <Badge variant="warning">Demo Data</Badge>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Instalment 1', due: '15 Oct 2026', status: 'Paid' },
              { label: 'Instalment 2', due: '15 Nov 2026', status: 'Pending' },
              { label: 'Instalment 3', due: '15 Dec 2026', status: 'Upcoming' },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-800">{f.label}</p>
                  <p className="text-xs text-slate-500">Due: {f.due}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  f.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  f.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {f.status}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Real fee schedule requires Phase 4 student-record linking. Demo amounts not shown.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate('/courses')}>Browse Courses</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/attendance')}>View My Attendance</Button>
        </div>
      </div>
    </div>
  );
}

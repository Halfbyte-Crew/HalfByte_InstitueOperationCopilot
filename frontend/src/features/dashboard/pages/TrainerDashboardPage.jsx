import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { EmptyState } from '../../../components/common/EmptyState';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { CalendarDays, ClipboardCheck, Users, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import { dashboardApi } from '../dashboardApi';

const BATCH_STATUS_STYLE = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  upcoming: 'bg-sky-50 text-sky-700 border-sky-100',
  completed: 'bg-slate-50 text-slate-500 border-slate-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
};

function BatchCard({ batch }) {
  const statusStyle = BATCH_STATUS_STYLE[batch.status] ?? 'bg-slate-50 text-slate-500';

  return (
    <div className="p-4 rounded-lg border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{batch.name}</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{batch.code}</p>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${statusStyle}`}>
          {batch.status}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {batch.enrolled_students} students
        </span>
        {batch.start_date && (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {new Date(batch.start_date).toLocaleDateString('en-IN')}
          </span>
        )}
      </div>
    </div>
  );
}

export function TrainerDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useApi(dashboardApi.getTrainerSchedule);

  const batches = data?.assigned_batches ?? [];

  return (
    <div>
      <PageHeader
        title="Trainer Dashboard"
        description="Your assigned batches, today's schedule, and attendance overview."
        action={
          <Button variant="primary" icon={ClipboardCheck} onClick={() => navigate('/attendance')}>
            Mark Attendance
          </Button>
        }
      />

      {/* Security notice */}
      <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
        <BookOpen className="h-4 w-4 shrink-0 text-indigo-500" />
        <span>
          Your view is limited to academic information. Fee and financial records are not accessible to this role.
        </span>
      </div>

      {error && <ErrorMessage message={error} className="mb-6" />}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Assigned Batches', value: batches.length, icon: CalendarDays, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          {
            label: 'Active Batches',
            value: batches.filter((b) => b.status === 'active').length,
            icon: Users,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Total Students',
            value: batches.reduce((acc, b) => acc + (b.enrolled_students ?? 0), 0),
            icon: Users,
            color: 'text-sky-600',
            bg: 'bg-sky-50',
          },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-7 bg-slate-100 rounded w-1/3" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{k.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{k.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${k.bg} ${k.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Batch grid */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Assigned Batches</h2>
          <Button size="sm" variant="outline" onClick={() => navigate('/batches')}>
            View Full Schedule
          </Button>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : batches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {batches.map((b) => (
                <BatchCard key={b.id} batch={b} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No batches assigned"
              description="You have not been assigned to any batches yet."
            />
          )}
        </div>
      </div>

      {/* Today's schedule — demo placeholder */}
      <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50/60 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="h-4 w-4 text-sky-600" />
          <h2 className="text-sm font-bold text-slate-900">Today's Classes</h2>
          <Badge variant="info">Demo Data</Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-sky-100 text-sm">
            <span className="font-medium text-slate-800">Python Full Stack — Batch A</span>
            <span className="text-xs text-sky-600 font-medium">10:00 AM – 12:00 PM</span>
          </div>
          <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-sky-100 text-sm">
            <span className="font-medium text-slate-800">React Advanced — Batch C</span>
            <span className="text-xs text-sky-600 font-medium">2:00 PM – 4:00 PM</span>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          ⚠ Class schedule shown above is demo data — real scheduling requires Phase 4 timetable integration.
        </p>
      </div>
    </div>
  );
}

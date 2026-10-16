import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { EmptyState } from '../../../components/common/EmptyState';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Users, CalendarDays, BookOpen, Phone, Mail, UserPlus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import { dashboardApi } from '../dashboardApi';

const STATUS_BADGE = {
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'default', label: 'Inactive' },
  suspended: { variant: 'danger', label: 'Suspended' },
};

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-100 rounded" />
        </td>
      ))}
    </tr>
  );
}

export function CounselorDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useApi(dashboardApi.getCounselorSummary);

  const kpis = [
    { label: 'Total Students', value: data?.total_students, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active Batches', value: data?.active_batches, icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Available Courses', value: data?.available_courses, icon: BookOpen, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Recent Admissions', value: data?.recent_admissions?.length ?? '—', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div>
      <PageHeader
        title="Counselor Dashboard"
        description="Manage student admissions, follow-ups, and your assigned pipeline."
        action={
          <Button variant="primary" icon={UserPlus} onClick={() => navigate('/students')}>
            Register Student
          </Button>
        }
      />

      {error && <ErrorMessage message={error} className="mb-6" />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-7 bg-slate-100 rounded w-1/3" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{k.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{k.value ?? '—'}</p>
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

      {/* Recent Admissions table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Admissions</h2>
          <Button size="sm" variant="outline" onClick={() => navigate('/students')}>View All Students</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? [1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)
                : data?.recent_admissions?.length > 0
                ? data.recent_admissions.map((s) => {
                    const status = STATUS_BADGE[s.status] ?? { variant: 'default', label: s.status };
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Mail className="h-3 w-3" /> {s.email}
                            </span>
                            {s.phone && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Phone className="h-3 w-3" /> {s.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    );
                  })
                : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12">
                      <EmptyState
                        title="No students yet"
                        description="Register your first student to see their record here."
                      />
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-up reminders — demo data, clearly labelled */}
      <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50/60 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-amber-600" />
          <h2 className="text-sm font-bold text-slate-900">Upcoming Follow-ups</h2>
          <Badge variant="warning">Demo Data</Badge>
        </div>
        <div className="space-y-2 text-sm text-slate-700">
          <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-amber-100">
            <span>Call Rahul Mehta regarding Java batch enquiry</span>
            <span className="text-xs text-amber-600 font-medium">Today</span>
          </div>
          <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-amber-100">
            <span>Send brochure to 3 new enquiry leads</span>
            <span className="text-xs text-amber-600 font-medium">Tomorrow</span>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          ⚠ Follow-up tasks are demo data — real task management requires Phase 4 CRM integration.
        </p>
      </div>
    </div>
  );
}

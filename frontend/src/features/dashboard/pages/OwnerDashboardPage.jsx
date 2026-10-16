import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { EmptyState } from '../../../components/common/EmptyState';
import {
  Users, BookOpen, CalendarDays, TrendingUp, AlertCircle,
  Sparkles, CreditCard, UserCheck, CheckSquare,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Loader } from '../../../components/ui/Loader';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import { dashboardApi } from '../dashboardApi';

function StatCard({ label, value, change, icon: Icon, color, bg, isLoading }) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-2/3 mb-3" />
        <div className="h-8 bg-slate-100 rounded w-1/3 mb-2" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value ?? '—'}</p>
        </div>
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {change && <p className="mt-3 text-xs text-slate-500 font-medium">{change}</p>}
    </div>
  );
}

export function OwnerDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useApi(dashboardApi.getOwnerStats);

  const fees = stats?.fee_summary;

  const metrics = [
    {
      label: 'Total Students',
      value: stats?.total_students?.toLocaleString() ?? '—',
      change: 'Active enrolments',
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Active Batches',
      value: stats?.active_batches?.toLocaleString() ?? '—',
      change: 'Running this term',
      icon: CalendarDays,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Trainers',
      value: stats?.total_trainers?.toLocaleString() ?? '—',
      change: 'Faculty members',
      icon: UserCheck,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
    {
      label: 'Overdue Fees',
      value: fees?.overdue_installments?.toLocaleString() ?? '—',
      change: 'Installments overdue',
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Operations Overview"
        description="Live status, performance metrics, and pending actions across the institute."
        action={
          <Button variant="primary" icon={Sparkles} onClick={() => navigate('/copilot')}>
            Launch Copilot
          </Button>
        }
      />

      {error && <ErrorMessage message={error} className="mb-6" />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {metrics.map((m) => (
          <StatCard key={m.label} {...m} isLoading={isLoading} />
        ))}
      </div>

      {/* Fee Summary + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Fee summary */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <CreditCard className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Financial Summary</h2>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : fees ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 font-medium">Total Receivable</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  ₹{Number(fees.total_receivable).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-xs text-emerald-600 font-medium">Collected</p>
                <p className="text-lg font-bold text-emerald-700 mt-1">
                  ₹{Number(fees.total_collected).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-4 bg-rose-50 rounded-lg">
                <p className="text-xs text-rose-600 font-medium">Outstanding</p>
                <p className="text-lg font-bold text-rose-700 mt-1">
                  ₹{Number(fees.total_outstanding).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState title="No financial data yet" description="Seed the database to see fee summaries." />
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col">
          <h2 className="text-base font-bold text-slate-900 mb-4">Quick Operations</h2>
          <div className="space-y-2 flex-1">
            <Button variant="secondary" className="w-full justify-start text-xs py-2" onClick={() => navigate('/students')}>
              + Register New Student
            </Button>
            <Button variant="secondary" className="w-full justify-start text-xs py-2" onClick={() => navigate('/attendance')}>
              Mark Today's Attendance
            </Button>
            <Button variant="secondary" className="w-full justify-start text-xs py-2" onClick={() => navigate('/batches')}>
              Schedule New Batch
            </Button>
            <Button variant="secondary" className="w-full justify-start text-xs py-2" onClick={() => navigate('/fees')}>
              Record Payment
            </Button>
            <Button variant="secondary" className="w-full justify-start text-xs py-2" onClick={() => navigate('/approvals')}>
              Review Approvals
            </Button>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
            Current Term: Fall 2026 Cohort
          </div>
        </div>
      </div>

      {/* AI Copilot Alerts — clearly labelled demo data */}
      <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900">AI Operations Copilot Insights</h2>
          <Badge variant="primary">Demo Data</Badge>
        </div>
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-white border border-slate-200 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Batch B-2024-Python attendance drop alert</p>
              <p className="text-xs text-slate-500 mt-1">
                5 students missed 3 consecutive classes this week. Propose automated reminder and coordinator check-in.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/approvals')}>Review Proposal</Button>
          </div>
          <div className="p-4 rounded-lg bg-white border border-slate-200 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Upcoming Batch Capacity Optimization</p>
              <p className="text-xs text-slate-500 mt-1">
                Full Stack React batch scheduled for next Monday has 28 enrolments with a capacity of 30.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate('/batches')}>View Batch</Button>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-slate-400 text-right">
          ⚠ AI alerts shown above are demo data — real AI integration requires Phase 4 copilot completion.
        </p>
      </div>
    </div>
  );
}

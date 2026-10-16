import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Users, BookOpen, CalendarDays, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const navigate = useNavigate();

  const metrics = [
    { label: 'Active Students', value: '428', change: '+12% this month', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Running Batches', value: '18', change: '3 concluding soon', icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg Attendance', value: '88.4%', change: 'Across all batches', icon: TrendingUp, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Pending Approvals', value: '4', change: 'Action required', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div>
      <PageHeader
        title="Operations Overview"
        description="Live status, performance metrics, and pending actions across the institute."
        action={
          <Button
            variant="primary"
            icon={Sparkles}
            onClick={() => navigate('/copilot')}
          >
            Launch Copilot
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${metric.bg} ${metric.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500 font-medium">{metric.change}</p>
            </div>
          );
        })}
      </div>

      {/* Two column layout: AI insights & Recent batches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Recommendations card */}
        <div className="lg:col-span-2 rounded-xl border border-indigo-100 bg-linear-to-br from-indigo-50/50 via-white to-slate-50 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">AI Operations Copilot Insights</h2>
            <Badge variant="primary">3 Pending Insights</Badge>
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
                  Full Stack React batch scheduled for next Monday has 28 enrollments with a capacity of 30.
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/batches')}>View Batch</Button>
            </div>
          </div>
        </div>

        {/* Quick actions & Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4">Quick Operations</h2>
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full justify-start text-xs py-2"
                onClick={() => navigate('/students')}
              >
                + Register New Student
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start text-xs py-2"
                onClick={() => navigate('/attendance')}
              >
                Mark Today's Attendance
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start text-xs py-2"
                onClick={() => navigate('/batches')}
              >
                Schedule New Batch
              </Button>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
            Current Term: Fall 2026 Cohort
          </div>
        </div>
      </div>
    </div>
  );
}

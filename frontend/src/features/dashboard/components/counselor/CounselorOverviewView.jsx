import React from 'react';
import {
  Users,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  PhoneCall,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/common/EmptyState';
import { ErrorMessage } from '../../../../components/common/ErrorMessage';

const STAGE_COLORS = {
  'New Enquiry': 'bg-sky-50 text-sky-700 border-sky-200',
  'Contacted': 'bg-blue-50 text-blue-700 border-blue-200',
  'Counseling Scheduled': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Application Started': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Documents Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'Documents Under Review': 'bg-orange-50 text-orange-700 border-orange-200',
  'Admission Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Enrolled': 'bg-teal-50 text-teal-700 border-teal-200',
  'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
  'Withdrawn': 'bg-slate-50 text-slate-700 border-slate-200',
};

export function CounselorOverviewView({
  data,
  isLoading,
  error,
  onRefresh,
  onNavigateTab,
  onCompleteTask,
  onRescheduleTask,
}) {
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={error} />
        <Button variant="outline" icon={RefreshCw} onClick={onRefresh}>
          Retry
        </Button>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Assigned Enquiries',
      value: data?.assigned_enquiries ?? 0,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      tab: 'enquiries',
    },
    {
      label: 'Active Admissions',
      value: data?.active_admissions ?? 0,
      icon: FileText,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      tab: 'admissions',
    },
    {
      label: 'Follow-ups Due Today',
      value: data?.followups_due_today ?? 0,
      icon: Clock,
      color: (data?.followups_due_today ?? 0) > 0 ? 'text-amber-600' : 'text-slate-600',
      bg: (data?.followups_due_today ?? 0) > 0 ? 'bg-amber-50' : 'bg-slate-50',
      tab: 'followups',
    },
    {
      label: 'Overdue Follow-ups',
      value: data?.overdue_followups ?? 0,
      icon: AlertTriangle,
      color: (data?.overdue_followups ?? 0) > 0 ? 'text-rose-600' : 'text-slate-600',
      bg: (data?.overdue_followups ?? 0) > 0 ? 'bg-rose-50' : 'bg-slate-50',
      badge: (data?.overdue_followups ?? 0) > 0 ? 'Action Needed' : null,
      tab: 'followups',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              onClick={() => onNavigateTab(k.tab)}
              className="group cursor-pointer rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md"
            >
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                  <div className="h-7 w-1/3 rounded bg-slate-100" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {k.label}
                      </p>
                      {k.badge && (
                        <span className="rounded-sm bg-rose-100 px-1 py-0.2 text-[10px] font-bold text-rose-700">
                          {k.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {k.value}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${k.bg} ${k.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Prioritized Next Actions Banner */}
      {data?.next_actions && data.next_actions.length > 0 && (
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-white to-sky-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Recommended Next Actions</h2>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {data.next_actions.length} Priorities
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.next_actions.slice(0, 3).map((act, idx) => (
              <div
                key={act.id || idx}
                onClick={() => onNavigateTab(act.target_tab || 'followups')}
                className="cursor-pointer rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-xs hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                        act.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : act.priority === 'High'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {act.priority}
                    </span>
                    <span className="text-xs font-medium text-slate-400">{act.due}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{act.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{act.description}</p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600">
                  <span>Take action</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Two-Column Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Tasks & Upcoming Reminders (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Tasks */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Today's Follow-up Tasks</h3>
                <span className="text-xs font-semibold text-slate-400">
                  ({data?.today_tasks?.length ?? 0})
                </span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onNavigateTab('followups')}>
                View All
              </Button>
            </div>
            <div className="divide-y divide-slate-100">
              {isLoading ? (
                <div className="p-6 text-center text-slate-400 animate-pulse text-sm">
                  Loading tasks...
                </div>
              ) : data?.today_tasks?.length > 0 ? (
                data.today_tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            task.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-700'
                              : task.priority === 'High'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900">{task.title}</h4>
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(task.due_datetime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => onRescheduleTask(task)}
                      >
                        Reschedule
                      </Button>
                      <Button
                        size="xs"
                        variant="primary"
                        icon={CheckCircle2}
                        onClick={() => onCompleteTask(task.id)}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8">
                  <EmptyState
                    title="No tasks due today"
                    description="You are caught up with all follow-up tasks for today."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Reminders */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Upcoming Reminders (Next 7 Days)</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onNavigateTab('followups')}>
                Manage
              </Button>
            </div>
            <div className="divide-y divide-slate-100">
              {isLoading ? (
                <div className="p-6 text-center text-slate-400 animate-pulse text-sm">
                  Loading reminders...
                </div>
              ) : data?.upcoming_reminders?.length > 0 ? (
                data.upcoming_reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{rem.title}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {rem.description || 'No additional details'}
                      </p>
                    </div>
                    <span className="font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {new Date(rem.due_datetime).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No upcoming reminders in the next 7 days.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Admission Pipeline & Recent Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Compact Pipeline Summary */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Admission Pipeline</h3>
              </div>
              <Button size="xs" variant="ghost" onClick={() => onNavigateTab('admissions')}>
                View Pipeline
              </Button>
            </div>
            <div className="space-y-2.5">
              {data?.pipeline_summary && data.pipeline_summary.length > 0 ? (
                data.pipeline_summary.map((stageItem) => (
                  <div
                    key={stageItem.stage}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                        stageItem.stage === 'Enrolled' || stageItem.stage === 'Admission Approved'
                          ? 'bg-emerald-500'
                          : stageItem.stage === 'Documents Under Review'
                          ? 'bg-orange-500'
                          : 'bg-indigo-500'
                      }`} />
                      <span className="text-xs font-medium text-slate-700">{stageItem.stage}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                      {stageItem.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No active admissions yet.</p>
              )}
            </div>
          </div>

          {/* Admissions Requiring Action */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Admissions Requiring Action</h3>
              <Button size="xs" variant="ghost" onClick={() => onNavigateTab('admissions')}>
                View All
              </Button>
            </div>
            <div className="divide-y divide-slate-100">
              {data?.admissions_requiring_action?.length > 0 ? (
                data.admissions_requiring_action.map((adm) => (
                  <div
                    key={adm.id}
                    onClick={() => onNavigateTab('admissions')}
                    className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">{adm.student_name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STAGE_COLORS[adm.stage] || 'bg-slate-100 text-slate-700'}`}>
                        {adm.stage}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {adm.pending_requirements || adm.next_action || adm.course_title}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-5 text-center text-xs text-slate-400">
                  All admissions are currently on track.
                </div>
              )}
            </div>
          </div>

          {/* Recently Updated Enquiries */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent Enquiries</h3>
              <Button size="xs" variant="ghost" onClick={() => onNavigateTab('enquiries')}>
                Workspace
              </Button>
            </div>
            <div className="divide-y divide-slate-100">
              {data?.recent_enquiries?.length > 0 ? (
                data.recent_enquiries.map((enq) => (
                  <div
                    key={enq.id}
                    onClick={() => onNavigateTab('enquiries')}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{enq.name}</p>
                      <p className="text-[11px] text-slate-500">{enq.course_name || 'General Inquiry'}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {enq.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-5 text-center text-xs text-slate-400">
                  No enquiry records found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

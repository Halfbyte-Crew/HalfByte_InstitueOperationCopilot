import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { EmptyState } from '../../../components/common/EmptyState';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import {
  Users,
  CalendarDays,
  UserCheck,
  BookOpen,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  X,
  FileCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi, useMutation } from '../../../hooks';
import { dashboardApi } from '../dashboardApi';
import { trainersApi } from '../../trainers/trainersApi';

function StatCard({ label, value, description, icon: Icon, color, bg, isLoading, onClick }) {
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
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value ?? '—'}</p>
        </div>
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {description && <p className="mt-3 text-xs text-slate-500 font-medium">{description}</p>}
    </div>
  );
}

export function OwnerDashboardPage() {
  const navigate = useNavigate();

  // Overview KPIs
  const {
    data: overview,
    isLoading: loadingOverview,
    error: overviewError,
    execute: refetchOverview,
  } = useApi(dashboardApi.getAdminOverview);

  // Upcoming Classes
  const {
    data: upcomingClassesRaw,
    isLoading: loadingClasses,
    execute: refetchClasses,
  } = useApi(() => dashboardApi.getUpcomingClasses({ limit: 8 }), [], { initialData: [] });
  const upcomingClasses = Array.isArray(upcomingClassesRaw) ? upcomingClassesRaw : [];

  // Scheduling Conflicts
  const {
    data: conflictsRaw,
    isLoading: loadingConflicts,
    execute: refetchConflicts,
  } = useApi(dashboardApi.getConflicts, [], { initialData: [] });
  const conflicts = Array.isArray(conflictsRaw) ? conflictsRaw : [];

  // Operational Alerts
  const {
    data: alertsRaw,
    isLoading: loadingAlerts,
    execute: refetchAlerts,
  } = useApi(dashboardApi.getAlerts, [], { initialData: [] });
  const alerts = Array.isArray(alertsRaw) ? alertsRaw : [];

  // Trainers for resolution modal
  const { data: trainersRaw } = useApi(() => trainersApi.getTrainers({ limit: 100 }), [], { initialData: [] });
  const trainers = Array.isArray(trainersRaw) ? trainersRaw : [];

  // Conflict Resolution Modal State
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [reassignSessionId, setReassignSessionId] = useState('');
  const [newTrainerId, setNewTrainerId] = useState('');
  const [newClassroom, setNewClassroom] = useState('');
  const [resolveSuccess, setResolveSuccess] = useState('');
  const [resolveError, setResolveError] = useState('');

  const { mutate: updateSchedule, isLoading: isUpdatingSchedule } = useMutation(
    (payload) => dashboardApi.updateSchedule(payload.id, payload.data)
  );

  const { mutate: acknowledgeAlert } = useMutation((alertId) =>
    dashboardApi.acknowledgeAlert(alertId)
  );

  const refreshAll = useCallback(() => {
    refetchOverview();
    refetchClasses();
    refetchConflicts();
    refetchAlerts();
  }, [refetchOverview, refetchClasses, refetchConflicts, refetchAlerts]);

  // Listen to global navbar refresh event
  useEffect(() => {
    const handleGlobalRefresh = () => refreshAll();
    window.addEventListener('edupilot:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('edupilot:refresh', handleGlobalRefresh);
  }, [refreshAll]);

  const handleOpenResolveModal = (conflict) => {
    setSelectedConflict(conflict);
    setResolveSuccess('');
    setResolveError('');
    if (conflict.affected_sessions && conflict.affected_sessions.length > 0) {
      setReassignSessionId(conflict.affected_sessions[0].schedule_id);
    }
  };

  const handleExecuteResolution = async (e) => {
    e.preventDefault();
    if (!reassignSessionId) return;

    const payload = {};
    if (newTrainerId) payload.trainer_id = newTrainerId;
    if (newClassroom) payload.classroom = newClassroom;

    if (Object.keys(payload).length === 0) {
      setResolveError('Please select a new faculty member or room to resolve the conflict.');
      return;
    }

    try {
      await updateSchedule({ id: reassignSessionId, data: payload });
      setResolveSuccess('Schedule successfully updated. Conflict resolved.');
      setTimeout(() => {
        setSelectedConflict(null);
        refreshAll();
      }, 900);
    } catch (err) {
      setResolveError(err.message || 'Failed to update schedule.');
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
      refetchAlerts();
      refetchOverview();
    } catch (e) {
      // quiet
    }
  };

  const kpis = [
    {
      label: 'Total Students',
      value: overview?.total_students?.toLocaleString() ?? '—',
      description: 'Active & enrolled records',
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Total Batches',
      value: overview?.total_batches?.toLocaleString() ?? '—',
      description: 'Active & upcoming cohorts',
      icon: CalendarDays,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      onClick: () => navigate('/operations'),
    },
    {
      label: 'Total Trainers',
      value: overview?.total_trainers?.toLocaleString() ?? '—',
      description: 'Appointed faculty members',
      icon: UserCheck,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      onClick: () => navigate('/staff'),
    },
    {
      label: 'Upcoming Classes',
      value: overview?.upcoming_classes?.toLocaleString() ?? '—',
      description: 'Scheduled lecture & lab sessions',
      icon: BookOpen,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      onClick: () => navigate('/operations'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Institute Operations & Governance"
        description="Live operational monitoring, faculty scheduling, conflict resolution, and administrative approvals."
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={refreshAll}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => navigate('/copilot')}
            >
              Knowledge Assistant
            </Button>
          </div>
        }
      />

      {overviewError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-rose-900">Failed to load institute metrics</p>
              <p className="text-xs text-rose-700 mt-1">{overviewError}</p>
            </div>
            <Button size="sm" variant="outline" onClick={refetchOverview}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} isLoading={loadingOverview} />
        ))}
      </div>

      {/* Scheduling Conflicts Banner / Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Scheduling Conflict Monitor
              </h2>
              <p className="text-xs text-slate-500">
                Automated collision detection across faculty assignments and physical laboratories.
              </p>
            </div>
          </div>
          {conflicts.length > 0 ? (
            <Badge variant="danger">{conflicts.length} Active Conflicts</Badge>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              All Schedules Clear
            </span>
          )}
        </div>

        {loadingConflicts ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : conflicts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No scheduling overlaps or facility double-bookings detected in upcoming timetables.
          </div>
        ) : (
          <div className="space-y-4">
            {conflicts.map((conflict) => (
              <div
                key={conflict.conflict_id}
                className="rounded-lg border border-rose-200 bg-rose-50/40 p-4 transition-all hover:bg-rose-50/70"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white">
                        {conflict.conflict_type.replace('_', ' ')}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{conflict.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600">{conflict.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-1">
                      <span className="flex items-center gap-1 text-slate-700">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        {conflict.scheduled_date}
                      </span>
                      <span className="flex items-center gap-1 text-rose-700 font-semibold">
                        <Clock className="h-3.5 w-3.5" />
                        Overlap: {conflict.overlapping_time}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">{conflict.resolution_hint}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    className="shrink-0 self-start sm:self-center"
                    onClick={() => handleOpenResolveModal(conflict)}
                  >
                    Resolve Conflict
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: AI Operational Alerts + Quick Administrative Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operational Alerts Panel */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Operational Alerts Panel</h2>
                <p className="text-xs text-slate-500">
                  Real-time policy exceptions, missing faculty assignments, and AI insights.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400">{alerts.length} Items</span>
          </div>

          <div className="flex-1 space-y-3">
            {loadingAlerts ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="All Operations Running Smoothly"
                description="No active operational anomalies or unattended exceptions found."
              />
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition-all ${
                    alert.severity === 'CRITICAL'
                      ? 'border-rose-200 bg-rose-50/30'
                      : alert.severity === 'HIGH'
                      ? 'border-amber-200 bg-amber-50/30'
                      : alert.is_ai_generated
                      ? 'border-indigo-200 bg-indigo-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : alert.severity === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        {alert.is_ai_generated && (
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 flex items-center gap-1 border border-violet-200">
                            <Sparkles className="h-2.5 w-2.5" />
                            AI Synthesis
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-slate-900">{alert.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600">{alert.explanation}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => navigate(alert.action_link)}
                      >
                        {alert.action_label}
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleDismissAlert(alert.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        title="Acknowledge Alert"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Administrative Quick Hub */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Administrative Portals</h2>
            <p className="text-xs text-slate-500 mb-4">
              Institute management modules strictly scoped to administration.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate('/operations')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Operations & Scheduling</div>
                  <div className="text-[11px] text-slate-500">Timetables, lab assignments, conflict resolver</div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/staff')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Staff Management</div>
                  <div className="text-[11px] text-slate-500">Personnel directory, roles & permissions</div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/approvals')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Action Approvals Center</div>
                  <div className="text-[11px] text-slate-500">
                    {overview?.pending_approvals_count ?? 0} request(s) awaiting administrative review
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/copilot')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 text-left transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    AI Knowledge Assistant
                  </div>
                  <div className="text-[11px] text-indigo-700">RAG chatbot with grounded page citations</div>
                </div>
                <ChevronRight className="h-4 w-4 text-indigo-500" />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Institute Term: {overview?.current_term || 'Fall 2026'}</span>
            <span className="font-mono text-[11px]">EduPilot v1.2</span>
          </div>
        </div>
      </div>

      {/* Upcoming Classes Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Upcoming Academic Sessions</h2>
            <p className="text-xs text-slate-500">
              Immediate scheduled lectures, laboratory practicums, and cohort sessions.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            icon={ArrowRight}
            onClick={() => navigate('/operations')}
          >
            Manage Timetables
          </Button>
        </div>

        {loadingClasses ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : upcomingClasses.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">
            No upcoming sessions scheduled for this week.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Batch & Course</th>
                  <th className="py-3 px-4">Session Title</th>
                  <th className="py-3 px-4">Assigned Faculty</th>
                  <th className="py-3 px-4">Scheduled Date & Time</th>
                  <th className="py-3 px-4">Location / Link</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingClasses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{c.batch_code}</span>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{c.course_title}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{c.title}</td>
                    <td className="py-3 px-4">
                      {c.trainer_name === 'Unassigned' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                          Missing Faculty
                        </span>
                      ) : (
                        <span className="text-slate-700 font-medium">{c.trainer_name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{c.scheduled_date}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {c.start_time} - {c.end_time}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {c.classroom}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conflict Resolution Modal */}
      {selectedConflict && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedConflict(null)}
          title="Resolve Scheduling Conflict"
        >
          <form onSubmit={handleExecuteResolution} className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
              <p className="font-bold text-rose-900">{selectedConflict.title}</p>
              <p className="text-rose-700">{selectedConflict.description}</p>
              <p className="text-rose-600 font-medium">Overlap Window: {selectedConflict.overlapping_time}</p>
            </div>

            {resolveError && <ErrorMessage message={resolveError} />}
            {resolveSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {resolveSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Session to Modify
              </label>
              <select
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                value={reassignSessionId}
                onChange={(e) => setReassignSessionId(e.target.value)}
              >
                {selectedConflict.affected_sessions.map((s) => (
                  <option key={s.schedule_id} value={s.schedule_id}>
                    {s.title} ({s.time})
                  </option>
                ))}
              </select>
            </div>

            {selectedConflict.conflict_type === 'TRAINER_OVERLAP' ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reassign Alternate Faculty Member
                </label>
                <select
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                  value={newTrainerId}
                  onChange={(e) => setNewTrainerId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Faculty Member --</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialization})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reassign Alternate Classroom / Lab
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lab 204 or Seminar Hall B"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                  value={newClassroom}
                  onChange={(e) => setNewClassroom(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedConflict(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={isUpdatingSchedule}
              >
                Confirm Resolution
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

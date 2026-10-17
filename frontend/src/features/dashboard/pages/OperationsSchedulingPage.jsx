import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { EmptyState } from '../../../components/common/EmptyState';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import {
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Edit2,
  Users,
  Search,
} from 'lucide-react';
import { useApi, useMutation } from '../../../hooks';
import { dashboardApi } from '../dashboardApi';
import { batchesApi } from '../../batches/batchesApi';
import { trainersApi } from '../../trainers/trainersApi';

export function OperationsSchedulingPage() {
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);

  // Resolution form state
  const [reassignSessionId, setReassignSessionId] = useState('');
  const [newTrainerId, setNewTrainerId] = useState('');
  const [newClassroom, setNewClassroom] = useState('');
  const [resolveError, setResolveError] = useState('');
  const [resolveSuccess, setResolveSuccess] = useState('');

  // Create form state
  const [newSchedule, setNewSchedule] = useState({
    batch_id: '',
    trainer_id: '',
    title: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '11:30',
    classroom: 'Lab 101',
    meeting_link: '',
  });
  const [createError, setCreateError] = useState('');

  // APIs
  const {
    data: classesRaw,
    isLoading: loadingClasses,
    error: classesError,
    execute: refetchClasses,
  } = useApi(() => dashboardApi.getUpcomingClasses({ limit: 50 }), [], { initialData: [] });
  const classes = Array.isArray(classesRaw) ? classesRaw : [];

  const {
    data: conflictsRaw,
    isLoading: loadingConflicts,
    execute: refetchConflicts,
  } = useApi(dashboardApi.getConflicts, [], { initialData: [] });
  const conflicts = Array.isArray(conflictsRaw) ? conflictsRaw : [];

  const { data: batchesRaw } = useApi(() => batchesApi.getBatches({ limit: 100 }), [], { initialData: [] });
  const batches = Array.isArray(batchesRaw) ? batchesRaw : [];

  const { data: trainersRaw } = useApi(() => trainersApi.getTrainers({ limit: 100 }), [], { initialData: [] });
  const trainers = Array.isArray(trainersRaw) ? trainersRaw : [];

  const { mutate: createSchedule, isLoading: isCreating } = useMutation(dashboardApi.createSchedule);
  const { mutate: updateSchedule, isLoading: isUpdating } = useMutation(
    (payload) => dashboardApi.updateSchedule(payload.id, payload.data)
  );
  const { mutate: deleteSchedule } = useMutation(dashboardApi.deleteSchedule);

  const refreshAll = useCallback(() => {
    refetchClasses();
    refetchConflicts();
  }, [refetchClasses, refetchConflicts]);

  const handleOpenResolve = (conflict) => {
    setSelectedConflict(conflict);
    setResolveError('');
    setResolveSuccess('');
    if (conflict.affected_sessions && conflict.affected_sessions.length > 0) {
      setReassignSessionId(conflict.affected_sessions[0].schedule_id);
    }
    setIsResolveModalOpen(true);
  };

  const handleExecuteResolution = async (e) => {
    e.preventDefault();
    if (!reassignSessionId) return;

    const payload = {};
    if (newTrainerId) payload.trainer_id = newTrainerId;
    if (newClassroom) payload.classroom = newClassroom;

    try {
      await updateSchedule({ id: reassignSessionId, data: payload });
      setResolveSuccess('Schedule updated and conflict resolved.');
      setTimeout(() => {
        setIsResolveModalOpen(false);
        refreshAll();
      }, 800);
    } catch (err) {
      setResolveError(err.message || 'Failed to update schedule.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newSchedule.batch_id || !newSchedule.title) {
      setCreateError('Please select a batch and enter a session title.');
      return;
    }

    try {
      const payload = {
        ...newSchedule,
        trainer_id: newSchedule.trainer_id ? newSchedule.trainer_id : null,
      };
      await createSchedule(payload);
      setIsCreateModalOpen(false);
      setNewSchedule({
        batch_id: '',
        trainer_id: '',
        title: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '11:30',
        classroom: 'Lab 101',
        meeting_link: '',
      });
      refreshAll();
    } catch (err) {
      setCreateError(err.message || 'Failed to create schedule session.');
    }
  };

  const handleDeleteSession = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this scheduled class session?')) return;
    try {
      await deleteSchedule(scheduleId);
      refreshAll();
    } catch (err) {
      alert(err.message || 'Failed to delete schedule.');
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.batch_code.toLowerCase().includes(search.toLowerCase()) ||
      c.trainer_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.classroom && c.classroom.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations & Scheduling"
        description="Comprehensive timetable monitoring, automated collision detection, and faculty scheduling."
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={refreshAll}>
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Schedule New Class
            </Button>
          </div>
        }
      />

      {/* Scheduling Conflicts Monitor */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Active Scheduling Conflicts ({conflicts.length})
            </h2>
          </div>
          {conflicts.length === 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              All Timetables Clear
            </span>
          )}
        </div>

        {conflicts.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">
            No overlapping trainer schedules or double-booked rooms found in upcoming records.
          </p>
        ) : (
          <div className="space-y-3">
            {conflicts.map((cnf) => (
              <div
                key={cnf.conflict_id}
                className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-600 text-white">
                      {cnf.conflict_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{cnf.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{cnf.description}</p>
                  <p className="text-[11px] font-semibold text-rose-700 mt-0.5">
                    Date: {cnf.scheduled_date} | Overlap: {cnf.overlapping_time}
                  </p>
                </div>
                <Button size="sm" variant="primary" onClick={() => handleOpenResolve(cnf)}>
                  Resolve Conflict
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Classes Directory / Timetable */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Scheduled Sessions ({filteredClasses.length})
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search batch, trainer, or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {loadingClasses ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredClasses.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">
            No class sessions match your search criteria.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Batch & Course</th>
                  <th className="py-2.5 px-3">Session Title</th>
                  <th className="py-2.5 px-3">Assigned Faculty</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Location / Link</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClasses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900">{item.batch_code}</span>
                      <p className="text-[11px] text-slate-500">{item.course_title}</p>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{item.title}</td>
                    <td className="py-2.5 px-3">
                      {item.trainer_name === 'Unassigned' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                          Unassigned
                        </span>
                      ) : (
                        <span className="text-slate-700 font-medium">{item.trainer_name}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div>{item.scheduled_date}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {item.start_time} - {item.end_time}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {item.classroom}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Class Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          title="Schedule New Class Session"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
            {createError && <ErrorMessage message={createError} />}

            <div>
              <label className="block font-medium text-slate-700 mb-1">Batch Cohort *</label>
              <select
                className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                value={newSchedule.batch_id}
                onChange={(e) => setNewSchedule({ ...newSchedule, batch_id: e.target.value })}
                required
              >
                <option value="">-- Select Batch Cohort --</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Session Title *</label>
              <input
                type="text"
                placeholder="e.g. System Design: Caching & Message Queues"
                className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                value={newSchedule.title}
                onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Faculty Member</label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  value={newSchedule.trainer_id}
                  onChange={(e) => setNewSchedule({ ...newSchedule, trainer_id: e.target.value })}
                >
                  <option value="">-- Unassigned (Assign Later) --</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Classroom / Lab</label>
                <input
                  type="text"
                  placeholder="e.g. Lab 101"
                  className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  value={newSchedule.classroom}
                  onChange={(e) => setNewSchedule({ ...newSchedule, classroom: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Scheduled Date *</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  value={newSchedule.scheduled_date}
                  onChange={(e) => setNewSchedule({ ...newSchedule, scheduled_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Start Time (HH:MM) *</label>
                <input
                  type="text"
                  placeholder="09:00"
                  className="w-full rounded-lg border border-slate-300 p-2 bg-white font-mono"
                  value={newSchedule.start_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">End Time (HH:MM) *</label>
                <input
                  type="text"
                  placeholder="10:30"
                  className="w-full rounded-lg border border-slate-300 p-2 bg-white font-mono"
                  value={newSchedule.end_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={isCreating}>
                Save Session
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Conflict Resolution Modal */}
      {isResolveModalOpen && selectedConflict && (
        <Modal
          isOpen={true}
          onClose={() => setIsResolveModalOpen(false)}
          title="Resolve Scheduling Collision"
        >
          <form onSubmit={handleExecuteResolution} className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
              <p className="font-bold text-rose-900">{selectedConflict.title}</p>
              <p className="text-rose-700">{selectedConflict.description}</p>
              <p className="text-rose-600 font-medium">Overlap Window: {selectedConflict.overlapping_time}</p>
            </div>

            {resolveError && <ErrorMessage message={resolveError} />}
            {resolveSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                {resolveSuccess}
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-700 mb-1">Select Session to Modify</label>
              <select
                className="w-full rounded-lg border border-slate-300 p-2 bg-white"
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
                <label className="block font-medium text-slate-700 mb-1">Reassign Alternate Faculty</label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2 bg-white"
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
                <label className="block font-medium text-slate-700 mb-1">Reassign Alternate Room / Lab</label>
                <input
                  type="text"
                  placeholder="e.g. Seminar Hall B"
                  className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  value={newClassroom}
                  onChange={(e) => setNewClassroom(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsResolveModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={isUpdating}>
                Confirm Resolution
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

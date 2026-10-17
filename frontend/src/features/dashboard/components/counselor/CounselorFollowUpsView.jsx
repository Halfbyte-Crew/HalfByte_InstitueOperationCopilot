import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Check,
  RotateCcw,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { EmptyState } from '../../../../components/common/EmptyState';
import { ErrorMessage } from '../../../../components/common/ErrorMessage';
import {
  getCounselorFollowUps,
  createCounselorFollowUp,
  completeCounselorFollowUp,
  rescheduleCounselorFollowUp,
  getCounselorEnquiries,
  getCounselorStudents,
} from '../../dashboardApi';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'due_today', label: 'Due Today' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
];

const PRIORITY_BADGES = {
  High: 'bg-rose-50 text-rose-700 border-rose-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-slate-50 text-slate-600 border-slate-200',
};

export function CounselorFollowUpsView({ initialFilter = 'all', onNavigateToRecord }) {
  const [tasks, setTasks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [activeTab, setActiveTab] = useState(initialFilter);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Associations for Create Form
  const [enquiries, setEnquiries] = useState([]);
  const [students, setStudents] = useState([]);
  const [createForm, setCreateForm] = useState({
    title: '',
    task_type: 'Follow-up Call',
    priority: 'Medium',
    due_date: '',
    description: '',
    enquiry_id: '',
    student_id: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Complete Form
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Reschedule Form
  const [newDueDate, setNewDueDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        skip: (page - 1) * limit,
        limit,
      };
      if (activeTab !== 'all') {
        params.status_filter = activeTab;
      }
      if (priorityFilter) {
        params.priority = priorityFilter;
      }
      const data = await getCounselorFollowUps(params);
      setTasks(data.items || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load follow-up tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeTab, priorityFilter, page]);

  // Load associations when opening create modal
  const handleOpenCreate = async () => {
    setIsCreateOpen(true);
    setCreateError(null);
    try {
      const [enqRes, stuRes] = await Promise.all([
        getCounselorEnquiries({ limit: 50 }),
        getCounselorStudents({ limit: 50 }),
      ]);
      setEnquiries(enqRes.items || []);
      setStudents(stuRes.items || []);
    } catch (e) {
      console.warn('Could not load enquiries/students for task assignment', e);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createForm.title || !createForm.due_date) {
      setCreateError('Title and due date are required.');
      return;
    }
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      const payload = {
        title: createForm.title.trim(),
        task_type: createForm.task_type,
        priority: createForm.priority,
        due_date: new Date(createForm.due_date).toISOString(),
        description: createForm.description.trim() || undefined,
        enquiry_id: createForm.enquiry_id ? parseInt(createForm.enquiry_id, 10) : undefined,
        student_id: createForm.student_id ? parseInt(createForm.student_id, 10) : undefined,
      };
      await createCounselorFollowUp(payload);
      setIsCreateOpen(false);
      setCreateForm({
        title: '',
        task_type: 'Follow-up Call',
        priority: 'Medium',
        due_date: '',
        description: '',
        enquiry_id: '',
        student_id: '',
      });
      fetchTasks();
    } catch (err) {
      setCreateError(err?.response?.data?.detail || err.message || 'Failed to create task');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenComplete = (task) => {
    setSelectedTask(task);
    setOutcomeNotes('');
    setIsCompleteOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!selectedTask) return;
    setActionSubmitting(true);
    try {
      await completeCounselorFollowUp(selectedTask.id, {
        outcome_notes: outcomeNotes.trim() || 'Follow-up completed successfully.',
      });
      setIsCompleteOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || 'Failed to mark task complete');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleOpenReschedule = (task) => {
    setSelectedTask(task);
    setNewDueDate('');
    setRescheduleReason('');
    setIsRescheduleOpen(true);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedTask || !newDueDate) {
      alert('Please select a valid new due date.');
      return;
    }
    setActionSubmitting(true);
    try {
      await rescheduleCounselorFollowUp(selectedTask.id, {
        new_due_date: new Date(newDueDate).toISOString(),
        reason: rescheduleReason.trim() || 'Rescheduled by counselor',
      });
      setIsRescheduleOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || 'Failed to reschedule task');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Filter tasks client-side for search query
  const filteredTasks = tasks.filter((task) => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return (
      task.title?.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.task_type?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Follow-ups & Reminders</h2>
          <p className="text-sm text-slate-500">
            Track outbound calls, counseling sessions, document collection, and fee reminders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Follow-up
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 overflow-x-auto pb-px" aria-label="Tabs">
          {STATUS_FILTERS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title, note, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="text-sm rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Task List / Content */}
      {error && <ErrorMessage message={error} onRetry={fetchTasks} />}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading follow-ups...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No follow-up tasks found"
          description={
            activeTab === 'all'
              ? 'You have no assigned tasks. Schedule a new follow-up to stay organized.'
              : `No tasks found under "${STATUS_FILTERS.find((f) => f.id === activeTab)?.label}".`
          }
          actionLabel="Schedule Follow-up"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'Completed';
            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-50/60 border-slate-200 opacity-80'
                    : task.is_overdue
                    ? 'bg-rose-50/20 border-rose-200 hover:border-rose-300 shadow-xs'
                    : task.is_due_today
                    ? 'bg-amber-50/20 border-amber-200 hover:border-amber-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      disabled={isCompleted || actionSubmitting}
                      onClick={() => handleOpenComplete(task)}
                      className={`mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white cursor-default'
                          : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-600'
                      }`}
                      title={isCompleted ? 'Task completed' : 'Click to complete'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`text-sm font-semibold ${
                            isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h4>
                        <Badge
                          variant="secondary"
                          className={PRIORITY_BADGES[task.priority] || 'bg-slate-50 text-slate-700'}
                        >
                          {task.priority}
                        </Badge>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                          {task.task_type}
                        </span>
                        {task.is_overdue && !isCompleted && (
                          <Badge variant="destructive" className="flex items-center gap-1 bg-rose-500 text-white">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue
                          </Badge>
                        )}
                        {task.is_due_today && !isCompleted && (
                          <Badge className="bg-amber-500 text-white">Due Today</Badge>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Due: {new Date(task.due_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        {task.enquiry_id && (
                          <span className="flex items-center gap-1 text-indigo-600">
                            Enquiry #{task.enquiry_id}
                          </span>
                        )}
                        {task.student_id && (
                          <span className="flex items-center gap-1 text-sky-600">
                            Student #{task.student_id}
                          </span>
                        )}
                        {task.rescheduled_count > 0 && (
                          <span className="text-amber-600">
                            Rescheduled ({task.rescheduled_count}x)
                          </span>
                        )}
                        {isCompleted && task.completed_at && (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Done: {new Date(task.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {task.outcome_notes && (
                        <div className="mt-2 text-xs bg-slate-100/70 text-slate-700 p-2 rounded-lg border border-slate-200">
                          <span className="font-medium text-slate-900">Outcome: </span>
                          {task.outcome_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isCompleted && (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenReschedule(task)}
                        className="text-xs flex items-center gap-1 text-slate-600 hover:text-slate-900"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reschedule
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenComplete(task)}
                        className="text-xs flex items-center gap-1 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Complete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalCount > limit && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-600">
          <div>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} tasks
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * limit >= totalCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule Follow-up Task"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateTask} className="p-6 space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Call regarding Data Science scholarship"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Task Type</label>
              <select
                value={createForm.task_type}
                onChange={(e) => setCreateForm({ ...createForm, task_type: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-700"
              >
                <option value="Follow-up Call">Follow-up Call</option>
                <option value="Campus Visit">Campus Visit</option>
                <option value="Document Collection">Document Collection</option>
                <option value="Fee Reminder">Fee Reminder</option>
                <option value="Counseling Session">Counseling Session</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-700"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={createForm.due_date}
              onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 text-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link to Enquiry (Optional)
              </label>
              <select
                value={createForm.enquiry_id}
                onChange={(e) =>
                  setCreateForm({ ...createForm, enquiry_id: e.target.value, student_id: '' })
                }
                className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-700"
              >
                <option value="">None</option>
                {enquiries.map((enq) => (
                  <option key={enq.id} value={enq.id}>
                    #{enq.id} - {enq.full_name} ({enq.course_of_interest || 'General'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link to Student (Optional)
              </label>
              <select
                value={createForm.student_id}
                onChange={(e) =>
                  setCreateForm({ ...createForm, student_id: e.target.value, enquiry_id: '' })
                }
                className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-700"
              >
                <option value="">None</option>
                {students.map((stu) => (
                  <option key={stu.id} value={stu.id}>
                    {stu.name} ({stu.student_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Agenda</label>
            <textarea
              rows={3}
              placeholder="Provide background context or specific questions to address..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {createSubmitting ? 'Creating...' : 'Schedule Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* COMPLETE TASK MODAL */}
      <Modal
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
        title="Complete Follow-up Task"
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Marking task <span className="font-semibold text-slate-900">"{selectedTask?.title}"</span> as complete.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Outcome & Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Student answered, confirmed appointment for tomorrow 11 AM..."
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCompleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={actionSubmitting}
              onClick={handleConfirmComplete}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {actionSubmitting ? 'Saving...' : 'Confirm Completion'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* RESCHEDULE TASK MODAL */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Reschedule Follow-up Task"
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Rescheduling <span className="font-semibold text-slate-900">"{selectedTask?.title}"</span>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Due Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Rescheduling
            </label>
            <input
              type="text"
              placeholder="e.g. Candidate asked to call after work hours"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRescheduleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={actionSubmitting || !newDueDate}
              onClick={handleConfirmReschedule}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {actionSubmitting ? 'Saving...' : 'Save New Schedule'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import React, { useState, useCallback } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Table } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { CalendarDays, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { useApi, useMutation } from '../../../hooks';
import { batchesApi } from '../batchesApi';
import { coursesApi } from '../../courses/coursesApi';
import { trainersApi } from '../../trainers/trainersApi';

const STATUS_VARIANT = {
  upcoming: 'info',
  active: 'success',
  completed: 'default',
  cancelled: 'danger',
};

const EMPTY_FORM = {
  code: '',
  name: '',
  course_id: '',
  trainer_id: '',
  start_date: '',
  end_date: '',
  max_capacity: '',
  status: 'upcoming',
};

export function BatchesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const fetchBatches = useCallback(
    () => batchesApi.getBatches(statusFilter ? { status: statusFilter } : {}),
    [statusFilter]
  );
  const { data: batches = [], isLoading, error, execute: refresh } = useApi(fetchBatches, [statusFilter]);

  // Load courses + trainers for the modal selects
  const { data: courses = [] } = useApi(() => coursesApi.getCourses({ limit: 100 }), []);
  const { data: trainers = [] } = useApi(() => trainersApi.getTrainers({ limit: 100 }), []);

  const { mutate: createBatch, isLoading: isSaving } = useMutation(
    (payload) => batchesApi.createBatch(payload)
  );

  const openModal = () => {
    setFormData(EMPTY_FORM);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.code.trim() || !formData.course_id) {
      setFormError('Batch code and course are required.');
      return;
    }
    try {
      const payload = {
        ...formData,
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
        trainer_id: formData.trainer_id || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };
      await createBatch(payload);
      setIsModalOpen(false);
      refresh();
    } catch (err) {
      setFormError(err.message || 'Failed to schedule batch.');
    }
  };

  const columns = [
    {
      header: 'Batch',
      key: 'code',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name || row.code}</div>
          <div className="text-xs font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 inline-block mt-0.5">
            {row.code}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status] || 'default'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Capacity',
      key: 'max_capacity',
      render: (row) => (
        <span className="text-slate-600">
          {row.max_capacity ? `Max ${row.max_capacity}` : 'Unlimited'}
        </span>
      ),
    },
    {
      header: 'Start Date',
      key: 'start_date',
      render: (row) =>
        row.start_date ? new Date(row.start_date).toLocaleDateString('en-IN') : '—',
    },
    {
      header: 'End Date',
      key: 'end_date',
      render: (row) =>
        row.end_date ? new Date(row.end_date).toLocaleDateString('en-IN') : '—',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Batch Cohorts"
        description="Schedule, track, and monitor student batches and ongoing lecture tracks."
        action={
          <Button variant="primary" icon={Plus} onClick={openModal}>
            Schedule Batch
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['', 'upcoming', 'active', 'completed', 'cancelled'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Batches'}
          </button>
        ))}
        <Button variant="secondary" icon={RefreshCw} onClick={() => refresh()} isLoading={isLoading} className="ml-auto shrink-0">
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Table
        columns={columns}
        data={batches}
        isLoading={isLoading}
        emptyMessage="No batches found. Schedule your first batch to get started."
      />

      {/* Schedule Batch Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Batch" maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Batch Code"
              required
              placeholder="e.g. FSW-2026-A"
              value={formData.code}
              onChange={handleFormChange('code')}
            />
            <Input
              label="Batch Name"
              placeholder="e.g. Morning Cohort"
              value={formData.name}
              onChange={handleFormChange('name')}
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Course <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.course_id}
              onChange={handleFormChange('course_id')}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="">Select a course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Trainer</label>
            <select
              value={formData.trainer_id}
              onChange={handleFormChange('trainer_id')}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="">Select a trainer (optional)…</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={formData.start_date} onChange={handleFormChange('start_date')} />
            <Input label="End Date" type="date" value={formData.end_date} onChange={handleFormChange('end_date')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Capacity"
              type="number"
              min="1"
              placeholder="Leave blank for unlimited"
              value={formData.max_capacity}
              onChange={handleFormChange('max_capacity')}
            />
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={handleFormChange('status')}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {formError && <p className="text-sm text-rose-600">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              <CalendarDays className="h-4 w-4 mr-1.5" />
              Schedule Batch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

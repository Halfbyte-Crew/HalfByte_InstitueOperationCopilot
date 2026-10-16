import React, { useState, useCallback } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Table } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { UserPlus, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { useApi, useMutation } from '../../../hooks';
import { studentsApi } from '../studentsApi';

/* ── Status badge mapping ── */
const STATUS_VARIANT = {
  active: 'success',
  inactive: 'default',
  graduated: 'info',
  dropped: 'danger',
  on_hold: 'warning',
};

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  address: '',
  status: 'active',
};

export function StudentsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const debounceRef = React.useRef(null);

  /* ── Data fetch ── */
  const fetchStudents = useCallback(
    () => studentsApi.getStudents(debouncedSearch ? { search: debouncedSearch } : {}),
    [debouncedSearch]
  );
  const { data: students = [], isLoading, error, execute: refresh } = useApi(fetchStudents, [debouncedSearch]);

  /* ── Create mutation ── */
  const { mutate: createStudent, isLoading: isSaving, error: saveError } = useMutation(
    (payload) => studentsApi.createStudent(payload)
  );

  /* ── Handlers ── */
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

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
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    try {
      await createStudent(formData);
      setIsModalOpen(false);
      refresh();
    } catch (err) {
      setFormError(err.message || 'Failed to enroll student.');
    }
  };

  /* ── Table columns ── */
  const columns = [
    {
      header: 'Student',
      key: 'name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (row) => <span className="text-slate-600">{row.phone || '—'}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status] || 'default'}>
          {row.status?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Enrolled',
      key: 'created_at',
      render: (row) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '—',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Students Directory"
        description="Monitor enrollment status, academic track, and attendance metrics across active cohorts."
        action={
          <Button variant="primary" icon={UserPlus} onClick={openModal}>
            Enroll Student
          </Button>
        }
      />

      {/* Search & Refresh bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
        <Button
          variant="secondary"
          icon={RefreshCw}
          onClick={() => refresh()}
          isLoading={isLoading}
          className="shrink-0"
        >
          Refresh
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Data Table */}
      <Table
        columns={columns}
        data={students}
        isLoading={isLoading}
        emptyMessage="No students found. Enroll your first student to get started."
      />

      {/* Enroll Student Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enroll New Student">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Aarav Patel"
            value={formData.name}
            onChange={handleFormChange('name')}
          />
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. aarav@example.com"
            value={formData.email}
            onChange={handleFormChange('email')}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="e.g. +91 98765 43210"
            value={formData.phone}
            onChange={handleFormChange('phone')}
          />
          <Input
            label="Address"
            placeholder="City, State"
            value={formData.address}
            onChange={handleFormChange('address')}
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={handleFormChange('status')}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          {(formError || saveError) && (
            <p className="text-sm text-rose-600">{formError || saveError}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              Enroll Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

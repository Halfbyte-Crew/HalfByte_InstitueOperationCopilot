import React, { useState, useCallback } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Table } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { UserCheck, UserPlus, Search, RefreshCw, AlertCircle, Briefcase } from 'lucide-react';
import { useApi, useMutation } from '../../../hooks';
import { trainersApi } from '../trainersApi';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  specialization: '',
  bio: '',
};

function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-amber-100 text-amber-700',
];

export function TrainersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const debounceRef = React.useRef(null);

  const fetchTrainers = useCallback(
    () => trainersApi.getTrainers(debouncedSearch ? { search: debouncedSearch } : {}),
    [debouncedSearch]
  );
  const { data: trainers = [], isLoading, error, execute: refresh } = useApi(fetchTrainers, [debouncedSearch]);

  const { mutate: createTrainer, isLoading: isSaving } = useMutation(
    (payload) => trainersApi.createTrainer(payload)
  );

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
      await createTrainer(formData);
      setIsModalOpen(false);
      refresh();
    } catch (err) {
      setFormError(err.message || 'Failed to add trainer.');
    }
  };

  const columns = [
    {
      header: 'Trainer',
      key: 'name',
      render: (row, idx) => {
        const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
        return (
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shrink-0 ${colorClass}`}>
              {getInitials(row.name)}
            </span>
            <div>
              <div className="font-semibold text-slate-900">{row.name}</div>
              <div className="text-xs text-slate-500">{row.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Specialization',
      key: 'specialization',
      render: (row) =>
        row.specialization ? (
          <span className="flex items-center gap-1.5 text-slate-600">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
            {row.specialization}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (row) => <span className="text-slate-600">{row.phone || '—'}</span>,
    },
    {
      header: 'Status',
      key: 'is_active',
      render: (row) => (
        <Badge variant={row.is_active !== false ? 'success' : 'default'}>
          {row.is_active !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Joined',
      key: 'created_at',
      render: (row) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '—',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Trainer Directory"
        description="Manage faculty profiles, technical proficiencies, and assigned teaching hours."
        action={
          <Button variant="primary" icon={UserPlus} onClick={openModal}>
            Add Trainer
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Search by name, email, or specialization…"
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={() => refresh()} isLoading={isLoading} className="shrink-0">
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
        data={trainers}
        isLoading={isLoading}
        emptyMessage="No trainers registered yet. Add your first instructor to get started."
      />

      {/* Add Trainer Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Trainer Profile">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Dr. Arjun Mehta"
            value={formData.name}
            onChange={handleFormChange('name')}
          />
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. arjun.mehta@institute.in"
            value={formData.email}
            onChange={handleFormChange('email')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleFormChange('phone')}
            />
            <Input
              label="Specialization"
              placeholder="e.g. Machine Learning"
              value={formData.specialization}
              onChange={handleFormChange('specialization')}
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
            <textarea
              placeholder="Brief professional background…"
              value={formData.bio}
              onChange={handleFormChange('bio')}
              rows={3}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 resize-none"
            />
          </div>

          {formError && <p className="text-sm text-rose-600">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              <UserCheck className="h-4 w-4 mr-1.5" />
              Add Trainer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

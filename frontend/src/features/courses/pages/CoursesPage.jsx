import React, { useState, useCallback } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Table } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { BookOpen, Plus, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { useApi, useMutation } from '../../../hooks';
import { coursesApi } from '../coursesApi';

const EMPTY_FORM = {
  code: '',
  title: '',
  description: '',
  duration_weeks: '',
  max_students: '',
};

export function CoursesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const debounceRef = React.useRef(null);

  const fetchCourses = useCallback(
    () => coursesApi.getCourses(debouncedSearch ? { search: debouncedSearch } : {}),
    [debouncedSearch]
  );
  const { data: courses = [], isLoading, error, execute: refresh } = useApi(fetchCourses, [debouncedSearch]);

  const { mutate: createCourse, isLoading: isSaving } = useMutation(
    (payload) => coursesApi.createCourse(payload)
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
    if (!formData.code.trim() || !formData.title.trim()) {
      setFormError('Course code and title are required.');
      return;
    }
    try {
      const payload = {
        ...formData,
        duration_weeks: formData.duration_weeks ? parseInt(formData.duration_weeks) : null,
        max_students: formData.max_students ? parseInt(formData.max_students) : null,
      };
      await createCourse(payload);
      setIsModalOpen(false);
      refresh();
    } catch (err) {
      setFormError(err.message || 'Failed to create course.');
    }
  };

  const columns = [
    {
      header: 'Course',
      key: 'title',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.title}</div>
          <div className="text-xs font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 inline-block mt-0.5">
            {row.code}
          </div>
        </div>
      ),
    },
    {
      header: 'Description',
      key: 'description',
      render: (row) => (
        <span className="text-slate-500 text-sm line-clamp-2">{row.description || '—'}</span>
      ),
    },
    {
      header: 'Duration',
      key: 'duration_weeks',
      render: (row) => (
        <span className="flex items-center gap-1 text-slate-600">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          {row.duration_weeks ? `${row.duration_weeks} weeks` : '—'}
        </span>
      ),
    },
    {
      header: 'Max Students',
      key: 'max_students',
      render: (row) => (
        <Badge variant="info">{row.max_students ?? 'Unlimited'}</Badge>
      ),
    },
    {
      header: 'Created',
      key: 'created_at',
      render: (row) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '—',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Courses & Programs"
        description="Manage curriculum structures, module assignments, and certifications."
        action={
          <Button variant="primary" icon={Plus} onClick={openModal}>
            Create Course
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Search by code or title…"
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
          <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
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
        data={courses}
        isLoading={isLoading}
        emptyMessage="No courses configured yet. Create your first course to get started."
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Course">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Course Code"
              required
              placeholder="e.g. FSW-101"
              value={formData.code}
              onChange={handleFormChange('code')}
            />
            <Input
              label="Duration (weeks)"
              type="number"
              min="1"
              placeholder="e.g. 16"
              value={formData.duration_weeks}
              onChange={handleFormChange('duration_weeks')}
            />
          </div>
          <Input
            label="Course Title"
            required
            placeholder="e.g. Full-Stack Web Development"
            value={formData.title}
            onChange={handleFormChange('title')}
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              placeholder="Brief overview of the course curriculum…"
              value={formData.description}
              onChange={handleFormChange('description')}
              rows={3}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 resize-none"
            />
          </div>
          <Input
            label="Max Students"
            type="number"
            min="1"
            placeholder="Leave blank for unlimited"
            value={formData.max_students}
            onChange={handleFormChange('max_students')}
          />

          {formError && <p className="text-sm text-rose-600">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              Create Course
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

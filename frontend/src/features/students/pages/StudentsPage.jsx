import React, { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Table } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { UserPlus, Search, Filter } from 'lucide-react';

export function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const mockStudents = [
    { id: '1', name: 'Aarav Patel', email: 'aarav@example.com', course: 'Full-Stack Web Dev', batch: 'FSW-2026-A', status: 'Active', attendance: '94%' },
    { id: '2', name: 'Sophia Miller', email: 'sophia.m@example.com', course: 'Data Science & AI', batch: 'DSAI-2026-B', status: 'Active', attendance: '82%' },
    { id: '3', name: 'Rahul Sharma', email: 'rahul.s@example.com', course: 'Cloud & DevOps', batch: 'CDO-2026-A', status: 'At Risk', attendance: '68%' },
    { id: '4', name: 'Elena Rostova', email: 'elena@example.com', course: 'UI/UX Design Masterclass', batch: 'UIUX-2026-C', status: 'Completed', attendance: '98%' },
  ];

  const columns = [
    { header: 'Student Name', key: 'name', render: (row) => (
      <div>
        <div className="font-semibold text-slate-900">{row.name}</div>
        <div className="text-xs text-slate-500">{row.email}</div>
      </div>
    )},
    { header: 'Enrolled Course', key: 'course' },
    { header: 'Batch Code', key: 'batch' },
    { header: 'Attendance', key: 'attendance', render: (row) => (
      <span className={`font-semibold ${parseInt(row.attendance) < 75 ? 'text-rose-600' : 'text-slate-700'}`}>
        {row.attendance}
      </span>
    )},
    { header: 'Status', key: 'status', render: (row) => (
      <Badge variant={row.status === 'Active' ? 'success' : row.status === 'At Risk' ? 'danger' : 'info'}>
        {row.status}
      </Badge>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Students Directory"
        description="Monitor enrollment status, academic track, and attendance metrics across active cohorts."
        action={
          <Button variant="primary" icon={UserPlus}>
            Enroll Student
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Search by student name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        </div>
        <Button variant="secondary" icon={Filter} className="shrink-0">
          Filter Batches
        </Button>
      </div>

      {/* Data Table */}
      <Table
        columns={columns}
        data={mockStudents}
        isLoading={false}
      />
    </div>
  );
}

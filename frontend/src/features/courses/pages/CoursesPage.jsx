import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { BookOpen } from 'lucide-react';

export function CoursesPage() {
  return (
    <div>
      <PageHeader
        title="Courses & Programs"
        description="Manage curriculum structures, module assignments, and certifications."
      />
      <EmptyState
        icon={BookOpen}
        title="No courses configured yet"
        description="Define your institute curriculum and courses to begin assigning batches."
        actionLabel="+ Create First Course"
        onAction={() => alert('Course creation modal will open in Phase 3.')}
      />
    </div>
  );
}

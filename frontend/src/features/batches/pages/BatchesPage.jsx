import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { CalendarDays } from 'lucide-react';

export function BatchesPage() {
  return (
    <div>
      <PageHeader
        title="Batch Cohorts"
        description="Schedule, track, and monitor student batches and ongoing lecture tracks."
      />
      <EmptyState
        icon={CalendarDays}
        title="No active batches found"
        description="Batches organize students into schedules with assigned trainers and classrooms."
        actionLabel="+ Schedule New Batch"
        onAction={() => alert('Batch scheduling modal will open in Phase 3.')}
      />
    </div>
  );
}

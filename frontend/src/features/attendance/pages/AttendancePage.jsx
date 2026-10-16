import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ClipboardCheck } from 'lucide-react';

export function AttendancePage() {
  return (
    <div>
      <PageHeader
        title="Session Attendance"
        description="Mark and review student presence across scheduled training sessions."
      />
      <EmptyState
        icon={ClipboardCheck}
        title="Select a batch to record attendance"
        description="Daily attendance records feed into AI risk analysis and student progress certificates."
        actionLabel="Load Today's Schedule"
        onAction={() => alert('Attendance session roster will load in Phase 4.')}
      />
    </div>
  );
}

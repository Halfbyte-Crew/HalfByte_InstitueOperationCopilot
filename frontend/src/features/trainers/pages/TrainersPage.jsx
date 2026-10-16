import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { UserCheck } from 'lucide-react';

export function TrainersPage() {
  return (
    <div>
      <PageHeader
        title="Trainer Directory"
        description="Manage faculty profiles, technical proficiencies, and assigned teaching hours."
      />
      <EmptyState
        icon={UserCheck}
        title="No trainers registered"
        description="Add instructors and link them to their respective courses and batch sessions."
        actionLabel="+ Add Trainer Profile"
        onAction={() => alert('Trainer registration modal will open in Phase 3.')}
      />
    </div>
  );
}

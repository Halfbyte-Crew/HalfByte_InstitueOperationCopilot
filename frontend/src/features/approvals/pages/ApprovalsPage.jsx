import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { CheckSquare } from 'lucide-react';

export function ApprovalsPage() {
  return (
    <div>
      <PageHeader
        title="Action Approvals"
        description="Review, approve, or reject critical mutations proposed by coordinators or the AI Copilot."
      />
      <EmptyState
        icon={CheckSquare}
        title="No pending approval requests"
        description="High-impact actions such as batch transfers and fee adjustments will appear here for review."
      />
    </div>
  );
}

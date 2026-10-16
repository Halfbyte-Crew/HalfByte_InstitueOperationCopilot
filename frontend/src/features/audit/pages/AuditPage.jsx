import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ShieldCheck } from 'lucide-react';

export function AuditPage() {
  return (
    <div>
      <PageHeader
        title="System Audit Log"
        description="Immutable, tamper-evident chronological log of system actions and data modifications."
      />
      <EmptyState
        icon={ShieldCheck}
        title="Audit trail initialized"
        description="All authentication attempts, mutations, and approved actions are recorded immutably in PostgreSQL."
      />
    </div>
  );
}

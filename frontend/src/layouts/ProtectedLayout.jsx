/**
 * ProtectedLayout — kept for backward compatibility with existing routes.
 * All new routes should use RoleGuard directly.
 *
 * This wraps any child in RoleGuard without a role restriction, then renders
 * the shared DashboardLayout with an <Outlet /> for the child route.
 */
import React from 'react';
import { RoleGuard } from './RoleGuard';
import { DashboardLayout } from './DashboardLayout';

export function ProtectedLayout() {
  return (
    <RoleGuard allowedRoles={[]}>
      <DashboardLayout />
    </RoleGuard>
  );
}

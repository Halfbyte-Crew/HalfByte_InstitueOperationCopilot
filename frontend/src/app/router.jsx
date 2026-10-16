import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Auth
import { LoginPage } from '../features/auth/pages/LoginPage';

// Layouts
import { DashboardLayout } from '../layouts/DashboardLayout';
import { RoleGuard } from '../layouts/RoleGuard';

// Role-specific dashboard pages
import { OwnerDashboardPage } from '../features/dashboard/pages/OwnerDashboardPage';
import { CounselorDashboardPage } from '../features/dashboard/pages/CounselorDashboardPage';
import { TrainerDashboardPage } from '../features/dashboard/pages/TrainerDashboardPage';
import { AccountsDashboardPage } from '../features/dashboard/pages/AccountsDashboardPage';
import { StudentDashboardPage } from '../features/dashboard/pages/StudentDashboardPage';

// Feature pages
import { StudentsPage } from '../features/students/pages/StudentsPage';
import { CoursesPage } from '../features/courses/pages/CoursesPage';
import { BatchesPage } from '../features/batches/pages/BatchesPage';
import { TrainersPage } from '../features/trainers/pages/TrainersPage';
import { AttendancePage } from '../features/attendance/pages/AttendancePage';
import { FeesPage } from '../features/fees/pages/FeesPage';
import { CopilotPage } from '../features/copilot/pages/CopilotPage';
import { ApprovalsPage } from '../features/approvals/pages/ApprovalsPage';
import { AuditPage } from '../features/audit/pages/AuditPage';

// Role constants
const OWNER_ROLES = ['super_admin', 'admin'];
const COUNSELOR_ROLES = ['counselor', 'coordinator', 'super_admin', 'admin'];
const TRAINER_ROLES = ['trainer', 'super_admin', 'admin'];
const ACCOUNTS_ROLES = ['finance', 'super_admin', 'admin'];
const STUDENT_ROLES = ['student', 'super_admin', 'admin'];
// Feature pages — any authenticated role can view (backend enforces per-role access)
const ALL_AUTH_ROLES = ['super_admin', 'admin', 'counselor', 'coordinator', 'trainer', 'finance', 'student'];

/**
 * Helper: wraps a page element in RoleGuard + DashboardLayout.
 * The outer RoleGuard checks auth and role.
 * The inner DashboardLayout renders the sidebar/navbar shell.
 */
function dashboardRoute(allowedRoles, pageElement) {
  return {
    element: (
      <RoleGuard allowedRoles={allowedRoles}>
        <DashboardLayout />
      </RoleGuard>
    ),
    children: [{ index: true, element: pageElement }],
  };
}

export const router = createBrowserRouter([
  // ── Public ────────────────────────────────────────────────────────────────
  {
    path: '/login',
    element: <LoginPage />,
  },

  // ── Role-specific dashboards ──────────────────────────────────────────────
  {
    path: '/dashboard/owner',
    ...dashboardRoute(OWNER_ROLES, <OwnerDashboardPage />),
  },
  {
    path: '/dashboard/counselor',
    ...dashboardRoute(COUNSELOR_ROLES, <CounselorDashboardPage />),
  },
  {
    path: '/dashboard/trainer',
    ...dashboardRoute(TRAINER_ROLES, <TrainerDashboardPage />),
  },
  {
    path: '/dashboard/accounts',
    ...dashboardRoute(ACCOUNTS_ROLES, <AccountsDashboardPage />),
  },
  {
    path: '/dashboard/student',
    ...dashboardRoute(STUDENT_ROLES, <StudentDashboardPage />),
  },

  // ── Backward-compat: old /dashboard → owner dashboard ────────────────────
  {
    path: '/dashboard',
    ...dashboardRoute(OWNER_ROLES, <OwnerDashboardPage />),
  },

  // ── Shared feature pages (within the dashboard shell) ────────────────────
  {
    path: '/',
    element: (
      <RoleGuard allowedRoles={ALL_AUTH_ROLES}>
        <DashboardLayout />
      </RoleGuard>
    ),
    children: [
      {
        index: true,
        // Redirect root to /login; after login the user lands on their role dashboard
        element: <Navigate to="/login" replace />,
      },
      { path: 'students', element: <StudentsPage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'batches', element: <BatchesPage /> },
      { path: 'trainers', element: <TrainersPage /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'fees', element: <FeesPage /> },
      { path: 'copilot', element: <CopilotPage /> },
      { path: 'approvals', element: <ApprovalsPage /> },
      { path: 'audit', element: <AuditPage /> },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

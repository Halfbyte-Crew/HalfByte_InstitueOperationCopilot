import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProtectedLayout } from '../layouts/ProtectedLayout';

import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { StudentsPage } from '../features/students/pages/StudentsPage';
import { CoursesPage } from '../features/courses/pages/CoursesPage';
import { BatchesPage } from '../features/batches/pages/BatchesPage';
import { TrainersPage } from '../features/trainers/pages/TrainersPage';
import { AttendancePage } from '../features/attendance/pages/AttendancePage';
import { FeesPage } from '../features/fees/pages/FeesPage';
import { CopilotPage } from '../features/copilot/pages/CopilotPage';
import { ApprovalsPage } from '../features/approvals/pages/ApprovalsPage';
import { AuditPage } from '../features/audit/pages/AuditPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'students',
        element: <StudentsPage />,
      },
      {
        path: 'courses',
        element: <CoursesPage />,
      },
      {
        path: 'batches',
        element: <BatchesPage />,
      },
      {
        path: 'trainers',
        element: <TrainersPage />,
      },
      {
        path: 'attendance',
        element: <AttendancePage />,
      },
      {
        path: 'fees',
        element: <FeesPage />,
      },
      {
        path: 'copilot',
        element: <CopilotPage />,
      },
      {
        path: 'approvals',
        element: <ApprovalsPage />,
      },
      {
        path: 'audit',
        element: <AuditPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

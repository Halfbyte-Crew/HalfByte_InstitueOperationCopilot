/**
 * RBAC utilities — single source of truth for roles, route guards, and navigation.
 *
 * Design principle: frontend role checks are UX affordances only.
 * The backend independently enforces authorization on every request.
 */

// ── Role constants ──────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  COUNSELOR: 'counselor',
  COORDINATOR: 'coordinator',
  TRAINER: 'trainer',
  FINANCE: 'finance',
  STUDENT: 'student',
};

// ── Role → dashboard URL ────────────────────────────────────────────────────
const ROLE_DASHBOARD_MAP = {
  [ROLES.SUPER_ADMIN]: '/dashboard/owner',
  [ROLES.ADMIN]: '/dashboard/owner',
  [ROLES.COUNSELOR]: '/dashboard/counselor',
  [ROLES.COORDINATOR]: '/dashboard/counselor',
  [ROLES.TRAINER]: '/dashboard/trainer',
  [ROLES.FINANCE]: '/dashboard/accounts',
  [ROLES.STUDENT]: '/dashboard/student',
};

/**
 * Returns the correct dashboard URL for the given role.
 * Falls back to owner dashboard for unknown/super roles.
 */
export function getDashboardPath(role) {
  return ROLE_DASHBOARD_MAP[role] ?? '/dashboard/owner';
}

// ── Role-specific sidebar navigation items ──────────────────────────────────
// Icons are imported dynamically in Sidebar.jsx to keep this file icon-free.
export const NAV_CONFIG = {
  [ROLES.SUPER_ADMIN]: [
    { name: 'Overview', path: '/dashboard/owner', iconName: 'LayoutDashboard' },
    { name: 'AI Knowledge Assistant', path: '/copilot', iconName: 'Bot', badge: 'AI' },
    { name: 'Operations & Scheduling', path: '/operations', iconName: 'CalendarDays' },
    { name: 'Staff Management', path: '/staff', iconName: 'Users' },
    { name: 'Approvals', path: '/approvals', iconName: 'CheckSquare' },
  ],
  get [ROLES.ADMIN]() { return this[ROLES.SUPER_ADMIN]; },

  [ROLES.COUNSELOR]: [
    { name: 'Overview', path: '/dashboard/counselor', iconName: 'LayoutDashboard' },
    { name: 'My Enquiries', path: '/dashboard/counselor?tab=enquiries', iconName: 'UserCheck' },
    { name: 'My Students', path: '/dashboard/counselor?tab=students', iconName: 'Users' },
    { name: 'Follow-ups', path: '/dashboard/counselor?tab=followups', iconName: 'ClipboardCheck' },
    { name: 'Admissions', path: '/dashboard/counselor?tab=admissions', iconName: 'CheckSquare' },
    { name: 'AI Knowledge Bot', path: '/copilot', iconName: 'Bot', badge: 'AI' },
  ],
  get [ROLES.COORDINATOR]() { return this[ROLES.COUNSELOR]; },

  [ROLES.TRAINER]: [
    { name: 'Dashboard', path: '/dashboard/trainer', iconName: 'LayoutDashboard' },
    { name: 'My Batches', path: '/batches', iconName: 'CalendarDays' },
    { name: 'Attendance', path: '/attendance', iconName: 'ClipboardCheck' },
    { name: 'Courses', path: '/courses', iconName: 'BookOpen' },
  ],

  [ROLES.FINANCE]: [
    { name: 'Overview', path: '/dashboard/accounts', iconName: 'LayoutDashboard' },
    { name: 'Fees & EMIs', path: '/dashboard/accounts?tab=fees', iconName: 'CreditCard' },
    { name: 'Payment Records', path: '/dashboard/accounts?tab=payments', iconName: 'Receipt' },
    { name: 'Reconciliation', path: '/dashboard/accounts?tab=reconciliation', iconName: 'CheckCircle' },
    { name: 'Financial Reports', path: '/dashboard/accounts?tab=reports', iconName: 'FileText' },
    { name: 'AI Knowledge Bot', path: '/copilot', iconName: 'Bot', badge: 'AI' },
  ],

  [ROLES.STUDENT]: [
    { name: 'Dashboard', path: '/dashboard/student', iconName: 'LayoutDashboard' },
    { name: 'My Courses', path: '/courses', iconName: 'BookOpen' },
    { name: 'My Attendance', path: '/attendance', iconName: 'ClipboardCheck' },
  ],
};

/** Returns the nav items for the given role. Falls back to a minimal set. */
export function getNavItems(role) {
  return NAV_CONFIG[role] ?? NAV_CONFIG[ROLES.SUPER_ADMIN];
}

/**
 * Returns true if the given role is allowed to access the given dashboard path.
 * Used for frontend UX-level guard (NOT a security boundary).
 */
export function canAccessDashboard(role, path) {
  const allowedPath = getDashboardPath(role);
  return path === allowedPath;
}

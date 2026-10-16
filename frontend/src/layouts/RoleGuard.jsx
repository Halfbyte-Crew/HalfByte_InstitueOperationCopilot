import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/providers';
import { Loader } from '../components/ui/Loader';
import { getDashboardPath } from '../utils/rbac';

/**
 * RoleGuard — wraps a dashboard route and enforces two things:
 *
 * 1. Authentication: unauthenticated visitors are sent to /login.
 * 2. Authorization: authenticated users who do not have the required role are
 *    redirected to their own dashboard (not an error page, so they don't learn
 *    anything about what lives at the forbidden URL).
 *
 * This is a UX-level guard. The backend independently enforces RBAC on every
 * API request — do not rely on this component for security.
 *
 * @param {string[]} allowedRoles - Array of role strings that may access this route.
 * @param {React.ReactNode} children - The page to render when access is granted.
 */
export function RoleGuard({ allowedRoles, children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // While re-validating the JWT on page refresh, show a loading screen.
  if (isLoading) {
    return <Loader fullScreen text="Verifying session…" />;
  }

  // Not logged in → send to login, remembering the intended destination.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to own dashboard (not a 403 page).
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role;
    const hasAccess = allowedRoles.includes(userRole);
    if (!hasAccess) {
      return <Navigate to={getDashboardPath(userRole)} replace />;
    }
  }

  return children;
}

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/providers';
import { Loader } from '../components/ui/Loader';
import { DashboardLayout } from './DashboardLayout';

export function ProtectedLayout({ requiredRole }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader fullScreen text="Verifying session credentials..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'super_admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center p-8 bg-white border border-slate-200 rounded-xl shadow-xs">
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to access this resource. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return <DashboardLayout />;
}

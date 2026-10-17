import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw, LogOut, CheckSquare, AlertTriangle, Building2, Calendar } from 'lucide-react';
import { useAuth } from '../app/providers';
import { dashboardApi } from '../features/dashboard/dashboardApi';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  const fetchAlertsSummary = async () => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      try {
        const [alertsData, overviewData] = await Promise.all([
          dashboardApi.getAlerts().catch(() => []),
          dashboardApi.getAdminOverview().catch(() => null),
        ]);
        setAlerts(alertsData || []);
        if (overviewData) {
          setPendingApprovalsCount(overviewData.pending_approvals_count || 0);
        }
      } catch (e) {
        // quiet fallback
      }
    }
  };

  useEffect(() => {
    fetchAlertsSummary();
    const interval = setInterval(fetchAlertsSummary, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Dispatch global refresh event for active page to re-fetch
    window.dispatchEvent(new CustomEvent('edupilot:refresh'));
    await fetchAlertsSummary();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const totalNotifCount = alerts.length + (pendingApprovalsCount > 0 ? 1 : 0);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Welcome & Institute Header */}
      <div className="flex items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              Welcome, {user?.name || 'Administrator'}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              <Building2 className="h-3 w-3 text-indigo-600" />
              EduPilot Institute
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>{currentDateStr}</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Refresh Action */}
        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded-lg transition-all"
          title="Refresh dashboard data"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>

        {/* Notifications Popover Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Operational Alerts & Notifications"
          >
            <Bell className="h-5 w-5" />
            {totalNotifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                {totalNotifCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 text-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Operational Alerts
                  </h3>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200/50">
                    {alerts.length} active
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto py-2 space-y-2">
                {pendingApprovalsCount > 0 && (
                  <div
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/approvals');
                    }}
                    className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                      <CheckSquare className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>{pendingApprovalsCount} Pending Approval Requests</span>
                    </div>
                    <p className="text-[11px] text-amber-800 mt-1 line-clamp-2">
                      Requests requiring administrative authorization are awaiting decision.
                    </p>
                  </div>
                )}

                {alerts.length === 0 && pendingApprovalsCount === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500">
                    No active operational alerts or pending items.
                  </p>
                ) : (
                  alerts.slice(0, 4).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(alert.action_link || '/operations');
                      }}
                      className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {alert.title}
                        </span>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700'
                              : alert.severity === 'HIGH'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {alert.explanation}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/operations');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  View Operations & Scheduling →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs shadow-xs">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {user?.name || 'Administrator'}
            </div>
            <div className="text-[11px] text-slate-500 capitalize">
              {user?.role?.replace('_', ' ') || 'Admin'}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

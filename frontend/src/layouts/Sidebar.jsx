import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  UserCheck,
  ClipboardCheck,
  CreditCard,
  Bot,
  CheckSquare,
  ShieldCheck,
  GraduationCap,
  Settings,
  LogOut,
  User,
  X,
  Receipt,
  CheckCircle,
  FileText,
  Calendar,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { getNavItems } from '../utils/rbac';
import { useAuth } from '../app/providers';

// Map icon name strings (from rbac.js) to Lucide components.
const ICON_MAP = {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  Calendar,
  UserCheck,
  ClipboardCheck,
  CreditCard,
  Bot,
  CheckSquare,
  ShieldCheck,
  Receipt,
  CheckCircle,
  FileText,
  Clock,
  TrendingUp,
  GraduationCap,
};

/** Role label displayed in the sidebar header. */
const ROLE_LABEL = {
  super_admin: 'Owner / Admin',
  admin: 'Administrator',
  counselor: 'Counselor',
  coordinator: 'Coordinator',
  trainer: 'Trainer',
  finance: 'Accounts',
  student: 'Student Portal',
};

export function Sidebar({ userRole = 'super_admin' }) {
  const navItems = getNavItems(userRole);
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-xs">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <span className="text-base font-bold text-white tracking-tight">EduPilot</span>
          <span className="block text-[10px] text-indigo-400 font-medium uppercase tracking-wider">
            {ROLE_LABEL[userRole] ?? 'Operations & AI'}
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {userRole === 'student' ? 'My Portal' : 'Administrative Navigation'}
        </div>
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.iconName] ?? LayoutDashboard;
          const currentUrl = location.pathname + location.search;
          const isItemActive = item.path.includes('?')
            ? currentUrl === item.path
            : location.pathname === item.path && (!location.search || !navItems.some((n) => n.path === currentUrl));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isItemActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-400/20">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Current Administrator & Account Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-400 capitalize truncate">
                {ROLE_LABEL[user?.role] || user?.role || 'Admin'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
              title="Account Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-md transition-colors"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium">FastAPI Engine Online</span>
        </div>
      </div>

      {/* Account Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Administrator Profile</h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Name:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{user?.name || 'Administrator'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Email / ID:</span>
                <p className="font-mono text-slate-800 mt-0.5">{user?.email || user?.id || 'admin@edupilot.io'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Assigned Role:</span>
                <p className="font-semibold text-indigo-700 capitalize mt-0.5">{ROLE_LABEL[user?.role] || user?.role}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px]">
                Active Session: Authenticated via OAuth2 JWT with institutional permissions.
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

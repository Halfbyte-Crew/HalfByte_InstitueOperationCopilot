import React from 'react';
import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', path: '/students', icon: Users },
  { name: 'Courses', path: '/courses', icon: BookOpen },
  { name: 'Batches', path: '/batches', icon: CalendarDays },
  { name: 'Trainers', path: '/trainers', icon: UserCheck },
  { name: 'Attendance', path: '/attendance', icon: ClipboardCheck },
  { name: 'Fees & Invoicing', path: '/fees', icon: CreditCard, roleRestricted: true },
  { name: 'AI Copilot', path: '/copilot', icon: Bot, badge: 'AI' },
  { name: 'Action Approvals', path: '/approvals', icon: CheckSquare },
  { name: 'Audit History', path: '/audit', icon: ShieldCheck, roleRestricted: true },
];

export function Sidebar({ userRole = 'super_admin' }) {
  // Client-side visual filter (backend independently enforces authorization)
  const isFinanceRestricted = userRole === 'trainer';

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
            Operations & AI
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Management
        </div>
        {NAV_ITEMS.map((item) => {
          if (item.roleRestricted && isFinanceRestricted) {
            return null;
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
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

      {/* Footer / System Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-slate-400 font-medium">FastAPI Engine Online</span>
        </div>
      </div>
    </aside>
  );
}

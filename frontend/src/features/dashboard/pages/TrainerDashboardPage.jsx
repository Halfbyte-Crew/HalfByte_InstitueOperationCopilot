import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  ClipboardCheck,
  Clock,
  TrendingUp,
  RefreshCw,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../../app/providers';
import { getTrainerOverview, getTrainerSchedule } from '../dashboardApi';

// Sub-views
import { TrainerOverviewView } from '../components/trainer/TrainerOverviewView';
import { TrainerScheduleView } from '../components/trainer/TrainerScheduleView';
import { TrainerBatchesView } from '../components/trainer/TrainerBatchesView';
import { TrainerAttendanceView } from '../components/trainer/TrainerAttendanceView';
import { TrainerAttendanceHistoryView } from '../components/trainer/TrainerAttendanceHistoryView';
import { TrainerStudentProgressView } from '../components/trainer/TrainerStudentProgressView';
import { StudentAccountModal } from '../components/trainer/StudentAccountModal';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'schedule', label: 'My Schedule', icon: Calendar },
  { id: 'batches', label: 'My Batches', icon: BookOpen },
  { id: 'attendance', label: 'Mark Attendance', icon: ClipboardCheck },
  { id: 'history', label: 'Attendance History', icon: Clock },
  { id: 'progress', label: 'Student Progress', icon: TrendingUp },
];

export function TrainerDashboardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  // Overview data & schedule for badges & cards
  const [overviewData, setOverviewData] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Preselected states for inter-tab workflows
  const [preselectedSession, setPreselectedSession] = useState(null);
  const [preselectedStudentId, setPreselectedStudentId] = useState(searchParams.get('student_id') || '');
  const [preselectedBatchId, setPreselectedBatchId] = useState(searchParams.get('batch_id') || '');

  // Student Account Modal state
  const [accountModalStudent, setAccountModalStudent] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, scheduleRes] = await Promise.all([
        getTrainerOverview(),
        getTrainerSchedule(),
      ]);
      setOverviewData(overviewRes);
      setScheduleData(scheduleRes);
    } catch (err) {
      console.error('Failed to load trainer overview:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load trainer data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Global navbar refresh listener
  useEffect(() => {
    const handleGlobalRefresh = () => {
      fetchDashboardData();
    };
    window.addEventListener('edupilot:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('edupilot:refresh', handleGlobalRefresh);
  }, [fetchDashboardData]);

  // Tab change handler
  const handleTabChange = (tabId, extraParams = {}) => {
    const params = new URLSearchParams();
    params.set('tab', tabId);
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  // Workflow: jump to attendance tab with selected session
  const handleSelectSessionForAttendance = (session) => {
    setPreselectedSession(session);
    handleTabChange('attendance', {
      session_id: session.id,
      batch_id: session.batch_id,
    });
  };

  // Workflow: jump to student progress tab with selected student
  const handleSelectStudentForProgress = (studentId, batchId) => {
    setPreselectedStudentId(studentId);
    if (batchId) setPreselectedBatchId(batchId);
    handleTabChange('progress', {
      student_id: studentId,
      batch_id: batchId,
    });
  };

  // Workflow: open student account modal
  const handleSelectStudentForAccount = (student) => {
    setAccountModalStudent(student);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Trainer Academic Hub
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Faculty Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-700">{user?.name || user?.email}</span> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Role Boundary / Financial Isolation Notice */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>
          <strong>Trainer Access Boundary:</strong> Limited to academic schedules, batch rosters, attendance records, and student progress. Financial, fee, and payment records are strictly isolated.
        </span>
      </div>

      {/* Primary Dashboard Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-xl shadow-xs px-2 pt-2 border">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto" aria-label="Trainer Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            // Optional counts badges on tabs
            let countBadge = null;
            if (overviewData) {
              if (tab.id === 'schedule' && overviewData.todays_sessions > 0) {
                countBadge = overviewData.todays_sessions;
              } else if (tab.id === 'batches' && overviewData.assigned_batches > 0) {
                countBadge = overviewData.assigned_batches;
              } else if (tab.id === 'attendance' && overviewData.attendance_pending_today > 0) {
                countBadge = overviewData.attendance_pending_today;
              }
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {countBadge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      tab.id === 'attendance' && overviewData?.attendance_pending_today_count > 0
                        ? 'bg-amber-100 text-amber-700'
                        : isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content Display */}
      <div>
        {currentTab === 'overview' && (
          <TrainerOverviewView
            overview={overviewData}
            schedule={scheduleData}
            isLoading={isLoading}
            onNavigateTab={handleTabChange}
            onSelectSessionForAttendance={handleSelectSessionForAttendance}
          />
        )}

        {currentTab === 'schedule' && (
          <TrainerScheduleView
            onSelectSessionForAttendance={handleSelectSessionForAttendance}
          />
        )}

        {currentTab === 'batches' && (
          <TrainerBatchesView
            onSelectStudentForAccount={handleSelectStudentForAccount}
            onSelectStudentForProgress={handleSelectStudentForProgress}
            onNavigateTab={handleTabChange}
          />
        )}

        {currentTab === 'attendance' && (
          <TrainerAttendanceView
            preselectedSession={preselectedSession}
          />
        )}

        {currentTab === 'history' && (
          <TrainerAttendanceHistoryView />
        )}

        {currentTab === 'progress' && (
          <TrainerStudentProgressView
            preselectedStudentId={preselectedStudentId}
            preselectedBatchId={preselectedBatchId}
          />
        )}
      </div>

      {/* Global Student Account Creation & Activation Modal */}
      {accountModalStudent && (
        <StudentAccountModal
          isOpen={!!accountModalStudent}
          onClose={() => setAccountModalStudent(null)}
          student={accountModalStudent}
          onAccountCreated={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}

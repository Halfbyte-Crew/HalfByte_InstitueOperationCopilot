import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Clock,
  FileCheck,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../../app/providers';
import {
  getCounselorSummary,
  completeCounselorFollowUp,
  rescheduleCounselorFollowUp,
} from '../dashboardApi';
import { CounselorOverviewView } from '../components/counselor/CounselorOverviewView';
import { CounselorEnquiriesView } from '../components/counselor/CounselorEnquiriesView';
import { CounselorStudentsView } from '../components/counselor/CounselorStudentsView';
import { CounselorFollowUpsView } from '../components/counselor/CounselorFollowUpsView';
import { CounselorAdmissionsView } from '../components/counselor/CounselorAdmissionsView';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'enquiries', label: 'My Enquiries', icon: UserCheck },
  { id: 'students', label: 'My Students', icon: Users },
  { id: 'followups', label: 'Follow-ups & Reminders', icon: Clock },
  { id: 'admissions', label: 'Admissions', icon: FileCheck },
];

export function CounselorDashboardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const initialFollowupFilter = searchParams.get('filter') || 'all';

  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCounselorSummary();
      setSummaryData(data);
    } catch (err) {
      console.error('Error fetching counselor summary:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load counselor overview');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Global navbar refresh listener
  useEffect(() => {
    const handleGlobalRefresh = () => {
      fetchSummary();
    };
    window.addEventListener('edupilot:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('edupilot:refresh', handleGlobalRefresh);
  }, [fetchSummary]);

  const handleTabChange = (tabId, extraParams = {}) => {
    const params = new URLSearchParams();
    params.set('tab', tabId);
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handleCompleteTask = async (taskId, outcomeNotes = 'Completed from Overview') => {
    try {
      await completeCounselorFollowUp(taskId, { outcome_notes: outcomeNotes });
      fetchSummary();
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || 'Failed to complete task');
    }
  };

  const handleRescheduleTask = async (taskId, newDueDate, reason = 'Rescheduled from Overview') => {
    try {
      await rescheduleCounselorFollowUp(taskId, { new_due_date: newDueDate, reason });
      fetchSummary();
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || 'Failed to reschedule task');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Counselor Operations Hub
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Active Session
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-700">{user?.name || user?.email}</span> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSummary}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Primary Dashboard Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-xl shadow-xs px-2 pt-2 border">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto" aria-label="Counselor Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            // Optional counts badges on tabs
            let countBadge = null;
            if (summaryData) {
              if (tab.id === 'enquiries' && summaryData.assigned_enquiries_count > 0) {
                countBadge = summaryData.assigned_enquiries_count;
              } else if (tab.id === 'admissions' && summaryData.active_admissions_count > 0) {
                countBadge = summaryData.active_admissions_count;
              } else if (tab.id === 'followups') {
                const totalDue = (summaryData.follow_ups_due_today_count || 0) + (summaryData.follow_ups_overdue_count || 0);
                if (totalDue > 0) countBadge = totalDue;
              } else if (tab.id === 'students' && summaryData.assigned_students_count > 0) {
                countBadge = summaryData.assigned_students_count;
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
                      tab.id === 'followups' && summaryData?.follow_ups_overdue_count > 0
                        ? 'bg-rose-100 text-rose-700'
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
          <CounselorOverviewView
            data={summaryData}
            isLoading={isLoading}
            error={error}
            onRefresh={fetchSummary}
            onNavigateTab={handleTabChange}
            onCompleteTask={handleCompleteTask}
            onRescheduleTask={handleRescheduleTask}
          />
        )}

        {currentTab === 'enquiries' && (
          <CounselorEnquiriesView />
        )}

        {currentTab === 'students' && (
          <CounselorStudentsView />
        )}

        {currentTab === 'followups' && (
          <CounselorFollowUpsView
            initialFilter={initialFollowupFilter}
            onNavigateToRecord={(tab, id) => handleTabChange(tab)}
          />
        )}

        {currentTab === 'admissions' && (
          <CounselorAdmissionsView />
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  CheckCircle,
  FileText,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../../app/providers';
import { getFinanceOverview } from '../dashboardApi';
import { FinanceOverviewView } from '../components/finance/FinanceOverviewView';
import { FinanceFeesEmisView } from '../components/finance/FinanceFeesEmisView';
import { FinancePaymentsView } from '../components/finance/FinancePaymentsView';
import { FinanceReconciliationView } from '../components/finance/FinanceReconciliationView';
import { FinanceReportsView } from '../components/finance/FinanceReportsView';
import { RecordPaymentModal } from '../components/finance/RecordPaymentModal';
import { PaymentReceiptModal } from '../components/finance/PaymentReceiptModal';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'fees', label: 'Fees & EMIs', icon: CreditCard },
  { id: 'payments', label: 'Payment Records', icon: Receipt },
  { id: 'reconciliation', label: 'Reconciliation', icon: CheckCircle },
  { id: 'reports', label: 'Financial Reports', icon: FileText },
];

export function AccountsDashboardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  // Overview data & date filtering
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [overviewData, setOverviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [recordPaymentInitialData, setRecordPaymentInitialData] = useState(null);
  const [receiptPaymentId, setReceiptPaymentId] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { period: selectedPeriod };
      if (selectedPeriod === 'custom') {
        if (customDates.start) params.from_date = customDates.start;
        if (customDates.end) params.to_date = customDates.end;
      }
      const data = await getFinanceOverview(params);
      setOverviewData(data);
    } catch (err) {
      console.error('Error fetching finance overview:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load financial overview');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, customDates]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Global navbar refresh listener
  useEffect(() => {
    const handleGlobalRefresh = () => {
      fetchOverview();
    };
    window.addEventListener('edupilot:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('edupilot:refresh', handleGlobalRefresh);
  }, [fetchOverview]);

  const handleTabChange = (tabId, extraParams = {}) => {
    const params = new URLSearchParams();
    params.set('tab', tabId);
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handleOpenRecordPayment = (initialData = null) => {
    setRecordPaymentInitialData(initialData);
    setIsRecordPaymentOpen(true);
  };

  const handleCloseRecordPayment = () => {
    setIsRecordPaymentOpen(false);
    setRecordPaymentInitialData(null);
  };

  const handlePaymentSuccess = (paymentResult) => {
    fetchOverview();
    const pId = paymentResult?.id || paymentResult?.payment_id;
    if (pId) {
      setReceiptPaymentId(pId);
      setIsReceiptOpen(true);
    }
  };

  const handleOpenReceipt = (paymentId) => {
    setReceiptPaymentId(paymentId);
    setIsReceiptOpen(true);
  };

  const handleCloseReceipt = () => {
    setIsReceiptOpen(false);
    setReceiptPaymentId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Finance & Accounts Hub
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Accounts Staff
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-700">{user?.name || user?.email}</span> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOverview}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Ledger
          </button>
          <button
            type="button"
            onClick={() => handleOpenRecordPayment()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Tab Content */}
      <div className="mt-4">
        {currentTab === 'overview' && (
          <FinanceOverviewView
            data={overviewData}
            isLoading={isLoading}
            error={error}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            customDates={customDates}
            onCustomDatesChange={setCustomDates}
            onRefresh={fetchOverview}
            onNavigateTab={handleTabChange}
            onOpenRecordPayment={handleOpenRecordPayment}
          />
        )}

        {currentTab === 'fees' && (
          <FinanceFeesEmisView onOpenRecordPayment={handleOpenRecordPayment} />
        )}

        {currentTab === 'payments' && (
          <FinancePaymentsView
            onOpenRecordPayment={handleOpenRecordPayment}
            onOpenReceipt={handleOpenReceipt}
          />
        )}

        {currentTab === 'reconciliation' && (
          <FinanceReconciliationView onOpenReceipt={handleOpenReceipt} />
        )}

        {currentTab === 'reports' && <FinanceReportsView />}
      </div>

      {/* Reusable Modals */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={handleCloseRecordPayment}
        onSuccess={handlePaymentSuccess}
        initialData={recordPaymentInitialData}
      />

      <PaymentReceiptModal
        isOpen={isReceiptOpen}
        onClose={handleCloseReceipt}
        paymentId={receiptPaymentId}
      />
    </div>
  );
}

import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Filter,
  DollarSign,
  AlertTriangle,
  Receipt,
  FileText,
  Calendar,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/common/EmptyState';
import { ErrorMessage } from '../../../../components/common/ErrorMessage';

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'this_month', label: 'This Month' },
  { id: 'this_quarter', label: 'This Quarter' },
  { id: 'all_time', label: 'All Time' },
  { id: 'custom', label: 'Custom Range' },
];

export function FinanceOverviewView({
  data,
  isLoading,
  error,
  selectedPeriod,
  onPeriodChange,
  customDates,
  onCustomDatesChange,
  onRefresh,
  onNavigateTab,
  onOpenRecordPayment,
}) {
  const [showCustomPicker, setShowCustomPicker] = useState(selectedPeriod === 'custom');

  const handlePeriodClick = (pId) => {
    onPeriodChange(pId);
    setShowCustomPicker(pId === 'custom');
  };

  const rec = data?.reconciliation_summary;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Overview</h2>
          <p className="text-sm text-slate-500">
            Real-time fee collections, pending installments, overdue EMIs, and settlement reconciliation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePeriodClick(p.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  selectedPeriod === p.id
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={onOpenRecordPayment}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Custom Date Inputs if selected */}
      {showCustomPicker && (
        <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 shadow-xs text-xs">
          <span className="font-semibold text-slate-700">Custom Date Range:</span>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">From:</label>
            <input
              type="date"
              value={customDates?.start || ''}
              onChange={(e) => onCustomDatesChange({ ...customDates, start: e.target.value })}
              className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">To:</label>
            <input
              type="date"
              value={customDates?.end || ''}
              onChange={(e) => onCustomDatesChange({ ...customDates, end: e.target.value })}
              className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 text-xs"
            />
          </div>
          <Button size="xs" variant="outline" onClick={onRefresh}>
            Apply Range
          </Button>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={onRefresh} />}

      {/* 4 Primary Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Fees Collected
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              ₹{Number(data?.total_collected || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-700 font-semibold">{data?.collection_rate || '0%'}</span>
              <span>of total receivable</span>
            </p>
          </div>
        </div>

        {/* Total Fees Pending */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Fees Pending
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              ₹{Number(data?.total_pending || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Course fees: ₹{Number(data?.total_course_fees || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Overdue EMIs */}
        <div
          onClick={() => onNavigateTab('fees', { status: 'Overdue' })}
          className="bg-white rounded-xl border border-rose-200/80 p-5 shadow-xs hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Overdue EMIs
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-rose-700">
              ₹{Number(data?.overdue_amount || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-rose-600 font-medium mt-1">
              {data?.overdue_count || 0} overdue installments requiring action
            </p>
          </div>
        </div>

        {/* Upcoming Dues (Next 7 days) */}
        <div
          onClick={() => onNavigateTab('fees', { due_range: 'next_7_days' })}
          className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Upcoming Dues (7 Days)
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              ₹{Number(data?.upcoming_amount || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-amber-700 font-medium mt-1">
              {data?.upcoming_count || 0} installments maturing this week
            </p>
          </div>
        </div>
      </div>

      {/* Reconciliation Health Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300">
              Payment Settlement & Reconciliation Status
            </h3>
            <span className="text-[10px] bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded-full font-semibold">
              Internal Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile payments recorded at counters and gateway credits against verified bank transactions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800/90 border border-slate-700 px-3.5 py-2 rounded-lg text-xs">
            <span className="text-slate-400 block text-[10px]">Reconciled</span>
            <span className="font-bold text-emerald-400 text-sm">
              ₹{Number(rec?.reconciled_amount || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">({rec?.reconciled_count || 0})</span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 px-3.5 py-2 rounded-lg text-xs">
            <span className="text-slate-400 block text-[10px]">Unreconciled</span>
            <span className="font-bold text-amber-400 text-sm">
              ₹{Number(rec?.unreconciled_amount || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">({rec?.unreconciled_count || 0})</span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 px-3.5 py-2 rounded-lg text-xs">
            <span className="text-slate-400 block text-[10px]">Discrepancies</span>
            <span className="font-bold text-rose-400 text-sm">
              ₹{Number(rec?.discrepancy_amount || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">({rec?.discrepancy_count || 0})</span>
          </div>

          <Button
            size="sm"
            onClick={() => onNavigateTab('reconciliation')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Open Desk
          </Button>
        </div>
      </div>

      {/* Two-Column Layout: Overdue Alerts & Recent Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Overdue EMI Highlights (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">Overdue EMIs Requiring Follow-up</h3>
            </div>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onNavigateTab('fees', { status: 'overdue' })}
            >
              View All ({data?.overdue_count || 0})
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.overdue_highlights && data.overdue_highlights.length > 0 ? (
              data.overdue_highlights.map((item) => (
                <div
                  key={item.installment_id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.student_name}</span>
                      <Badge variant="destructive" className="bg-rose-500 text-white text-[10px]">
                        {item.days_overdue} days overdue
                      </Badge>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      {item.title} • Due: {new Date(item.due_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-rose-600 block">
                      ₹{Number(item.outstanding_balance).toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenRecordPayment &&
                        onOpenRecordPayment({
                          student_id: item.student_id,
                          installment_id: item.installment_id,
                          balance_due: item.outstanding_balance,
                        })
                      }
                      className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] mt-0.5 inline-flex items-center gap-0.5"
                    >
                      Receive payment <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No overdue installments recorded! All student fee plans are currently on track.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Collections Feed (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Collections</h3>
            </div>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onNavigateTab('payments')}
            >
              All Records
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recent_collections && data.recent_collections.length > 0 ? (
              data.recent_collections.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{tx.student_name}</span>
                      <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {tx.payment_method}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {tx.receipt_number} • {new Date(tx.payment_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-emerald-700 text-sm block">
                      +₹{Number(tx.amount).toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        tx.reconciliation_status === 'Reconciled'
                          ? 'bg-emerald-50 text-emerald-700'
                          : tx.reconciliation_status === 'Discrepancy'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {tx.reconciliation_status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent transactions found for the selected period.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

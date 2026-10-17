import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Building2,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/common/EmptyState';
import { ErrorMessage } from '../../../../components/common/ErrorMessage';
import { getFinanceReport, exportFinanceReportCsv } from '../../dashboardApi';

const REPORT_TABS = [
  { id: 'fee_collection', label: 'Fee Collection', icon: TrendingUp },
  { id: 'outstanding_fees', label: 'Outstanding Fees', icon: DollarSign },
  { id: 'overdue_emis', label: 'Overdue EMIs', icon: AlertTriangle },
  { id: 'upcoming_dues', label: 'Upcoming Dues', icon: Clock },
  { id: 'reconciliation', label: 'Reconciliation Audit', icon: CheckCircle },
];

export function FinanceReportsView() {
  const [activeReport, setActiveReport] = useState('fee_collection');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const data = await getFinanceReport(activeReport, params);
      setReportData(data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to generate financial report');
    } finally {
      setIsLoading(false);
    }
  }, [activeReport, fromDate, toDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      await exportFinanceReportCsv(activeReport, params);
    } catch (err) {
      alert(err.message || 'Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Reports</h2>
          <p className="text-sm text-slate-500">
            Generate institute-wide fee collection summaries, aging overdue receivables, and audit sheets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Report Switcher & Date Range Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Report Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 font-medium">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          />
          <span className="text-slate-500 font-medium">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
              className="text-xs text-slate-400 hover:text-slate-600 underline ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Report Content Panels */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 animate-pulse">
          Generating financial report data from live database...
        </div>
      ) : !reportData ? (
        <EmptyState title="No Report Data" description="Select a report or adjust date filters." />
      ) : (
        <div className="space-y-6">
          {/* Report 1: Fee Collection */}
          {activeReport === 'fee_collection' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Total Collected</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">
                    ₹{reportData.total_collected?.toLocaleString('en-IN') ?? '0'}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Payment Transactions</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {reportData.payment_count ?? 0}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Reporting Range</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {reportData.from_date || 'Inception'} → {reportData.to_date || 'Today'}
                  </p>
                </div>
              </div>

              {/* By Method Breakdown */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Payment Method Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(reportData.by_method || {}).map(([method, stats]) => (
                    <div key={method} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs uppercase font-semibold text-slate-500">{method.replace('_', ' ')}</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">₹{stats.total?.toLocaleString('en-IN')}</p>
                      <p className="text-2xs text-slate-400">{stats.count} transactions</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Day-by-Day Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 font-bold text-sm text-slate-900">
                  Daily Collections
                </div>
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Transactions</th>
                      <th className="px-4 py-3 text-right">Total Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(reportData.by_day || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-400 text-xs">
                          No daily transactions recorded in this period.
                        </td>
                      </tr>
                    ) : (
                      reportData.by_day.map((d) => (
                        <tr key={d.day} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{d.day}</td>
                          <td className="px-4 py-3">{d.count}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">
                            ₹{d.total?.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Report 2: Outstanding Fees */}
          {activeReport === 'outstanding_fees' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Total Outstanding Fees</p>
                  <p className="mt-2 text-2xl font-bold text-rose-600">
                    ₹{reportData.total_outstanding?.toLocaleString('en-IN') ?? '0'}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Students with Dues</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {reportData.total_students_with_dues ?? 0}
                  </p>
                </div>
              </div>

              {/* By Course */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 font-bold text-sm text-slate-900">
                  Outstanding Breakdown by Course
                </div>
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Course</th>
                      <th className="px-4 py-3">Students with Dues</th>
                      <th className="px-4 py-3 text-right">Outstanding Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(reportData.by_course || []).map((c) => (
                      <tr key={c.course_name} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{c.course_name}</td>
                        <td className="px-4 py-3">{c.student_count}</td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600">
                          ₹{c.outstanding?.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* By Student */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 font-bold text-sm text-slate-900">
                  Top Outstanding Student Balances
                </div>
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Course</th>
                      <th className="px-4 py-3">Total Course Fee</th>
                      <th className="px-4 py-3">Paid Amount</th>
                      <th className="px-4 py-3 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(reportData.by_student || []).map((s) => (
                      <tr key={s.student_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{s.course}</td>
                        <td className="px-4 py-3">₹{s.total_fee?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-emerald-600 font-medium">₹{s.paid?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600">
                          ₹{s.outstanding?.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Report 3: Overdue EMIs */}
          {activeReport === 'overdue_emis' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Total Overdue Amount</p>
                  <p className="mt-2 text-2xl font-bold text-rose-600">
                    ₹{reportData.total_overdue_amount?.toLocaleString('en-IN') ?? '0'}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Overdue Instalments Count</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {reportData.overdue_count ?? 0}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Student & Course</th>
                      <th className="px-4 py-3">Instalment #</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Days Overdue</th>
                      <th className="px-4 py-3">Due Amount</th>
                      <th className="px-4 py-3 text-right">Overdue Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(reportData.items || []).map((row) => (
                      <tr key={row.installment_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{row.student_name}</div>
                          <div className="text-2xs text-slate-400">{row.course_name}</div>
                        </td>
                        <td className="px-4 py-3 font-medium">EMI #{row.installment_number}</td>
                        <td className="px-4 py-3 text-xs">{row.due_date}</td>
                        <td className="px-4 py-3 text-rose-600 font-bold text-xs">{row.days_overdue} days</td>
                        <td className="px-4 py-3">₹{row.amount_due?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600">
                          ₹{row.balance_due?.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Report 4: Upcoming Dues */}
          {activeReport === 'upcoming_dues' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Upcoming Dues Expected</p>
                  <p className="mt-2 text-2xl font-bold text-amber-600">
                    ₹{reportData.upcoming_total?.toLocaleString('en-IN') ?? '0'}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Instalments Maturing</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {reportData.upcoming_count ?? 0}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Student & Course</th>
                      <th className="px-4 py-3">Instalment #</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Due Amount</th>
                      <th className="px-4 py-3 text-right">Balance to Collect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(reportData.items || []).map((row) => (
                      <tr key={row.installment_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{row.student_name}</div>
                          <div className="text-2xs text-slate-400">{row.course_name}</div>
                        </td>
                        <td className="px-4 py-3 font-medium">EMI #{row.installment_number}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-amber-700">{row.due_date}</td>
                        <td className="px-4 py-3">₹{row.amount_due?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-bold text-amber-600">
                          ₹{row.balance_due?.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Report 5: Reconciliation */}
          {activeReport === 'reconciliation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Reconciled Amount</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">
                    ₹{reportData.reconciled_total?.toLocaleString('en-IN') ?? '0'}
                  </p>
                  <p className="text-2xs text-slate-500 mt-1">{reportData.reconciled_count} transactions verified</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Unreconciled Amount</p>
                  <p className="mt-2 text-2xl font-bold text-amber-600">
                    ₹{reportData.unreconciled_total?.toLocaleString('en-IN') ?? '0'}
                  </p>
                  <p className="text-2xs text-slate-500 mt-1">{reportData.unreconciled_count} pending review</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Flagged Discrepancies</p>
                  <p className="mt-2 text-2xl font-bold text-rose-600">
                    ₹{reportData.discrepancy_total?.toLocaleString('en-IN') ?? '0'}
                  </p>
                  <p className="text-2xs text-slate-500 mt-1">{reportData.discrepancy_count} open flags</p>
                </div>
              </div>

              {/* Discrepancies table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-rose-50 font-bold text-sm text-rose-900">
                  Open Settlement Discrepancies
                </div>
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Receipt #</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Flagged Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(reportData.discrepancies || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                          No open settlement discrepancies recorded.
                        </td>
                      </tr>
                    ) : (
                      reportData.discrepancies.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-indigo-700 text-xs">
                            {d.receipt_number}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">{d.student_name}</td>
                          <td className="px-4 py-3 font-bold text-rose-600">
                            ₹{d.amount?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{d.transaction_reference || 'N/A'}</td>
                          <td className="px-4 py-3 text-xs text-rose-700 font-medium">
                            {d.discrepancy_reason || 'Unspecified'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

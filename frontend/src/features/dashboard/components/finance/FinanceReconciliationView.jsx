import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  FileText,
  User,
  X,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/common/EmptyState';
import { ErrorMessage } from '../../../../components/common/ErrorMessage';
import {
  getFinanceReconciliationSummary,
  getFinancePayments,
  reconcileFinancePayment,
  flagFinanceDiscrepancy,
} from '../../dashboardApi';

export function FinanceReconciliationView({ onOpenReceipt }) {
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('unreconciled');
  const [search, setSearch] = useState('');

  // Flag Discrepancy modal state
  const [flagModalPayment, setFlagModalPayment] = useState(null);
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);
  const [flagError, setFlagError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumData, pmtData] = await Promise.all([
        getFinanceReconciliationSummary(),
        getFinancePayments({
          reconciliation_status: statusFilter === 'all' ? undefined : statusFilter,
          search: search.trim() || undefined,
          page_size: 50,
        }),
      ]);
      setSummary(sumData);
      setPayments(pmtData.items || []);
    } catch (err) {
      console.error('Error fetching reconciliation data:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load reconciliation data');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkReconciled = async (paymentId) => {
    if (!window.confirm('Confirm that you have manually verified this transaction with the institute bank statement or payment settlement report?')) {
      return;
    }
    try {
      await reconcileFinancePayment(paymentId);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || 'Failed to reconcile payment');
    }
  };

  const handleOpenFlagModal = (payment) => {
    setFlagModalPayment(payment);
    setDiscrepancyReason(payment.discrepancy_reason || '');
    setFlagError(null);
  };

  const handleCloseFlagModal = () => {
    setFlagModalPayment(null);
    setDiscrepancyReason('');
    setFlagError(null);
  };

  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    if (!discrepancyReason.trim()) {
      setFlagError('Please provide a specific reason for flagging this discrepancy.');
      return;
    }
    setIsSubmittingFlag(true);
    setFlagError(null);
    try {
      await flagFinanceDiscrepancy(flagModalPayment.id, { reason: discrepancyReason.trim() });
      handleCloseFlagModal();
      fetchData();
    } catch (err) {
      setFlagError(err?.response?.data?.detail || err.message || 'Failed to flag discrepancy');
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Manual Disclaimer Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payment Reconciliation</h2>
          <p className="text-sm text-slate-500">
            Compare institute fee entries with bank credits, UTR statements, and gateway settlements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Manual Reconciliation Notice */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3 text-xs text-amber-900">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-950">Manual Internal Verification Workflow:</span>{' '}
          This system performs manual cross-auditing of recorded transactions against external bank statements or payment slips. Marking a transaction as reconciled verifies that an authorized accountant has inspected the corresponding credit.
        </div>
      </div>

      {/* Reconciliation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Unreconciled Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Unreconciled / Pending
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-700">
                ₹{summary?.unreconciled_amount?.toLocaleString('en-IN') ?? '0'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {summary?.unreconciled_count ?? 0} transactions awaiting audit
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Reconciled Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Reconciled & Verified
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                ₹{summary?.reconciled_amount?.toLocaleString('en-IN') ?? '0'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {summary?.reconciled_count ?? 0} confirmed settlements
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Discrepancy Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Flagged Discrepancies
              </p>
              <p className="mt-2 text-2xl font-bold text-rose-700">
                ₹{summary?.discrepancy_amount?.toLocaleString('en-IN') ?? '0'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {summary?.discrepancy_count ?? 0} items requiring investigation
              </p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'unreconciled', label: `Pending Review (${summary?.unreconciled_count ?? 0})` },
            { id: 'discrepancy', label: `Discrepancies (${summary?.discrepancy_count ?? 0})` },
            { id: 'reconciled', label: `Reconciled (${summary?.reconciled_count ?? 0})` },
            { id: 'all', label: 'All Records' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reference, student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Transactions Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Receipt #</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Student</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Reference / UTR</th>
                <th className="px-4 py-3.5">Status & Audit Trail</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState
                      title="No Transactions to Display"
                      description={`No payments found for the "${statusFilter}" reconciliation status.`}
                    />
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-700 text-xs">
                      {p.receipt_number}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{p.student_name}</div>
                      <div className="text-2xs text-slate-400 font-mono">
                        {p.student_code || p.student_email || ('ID: ' + String(p.student_id).slice(0, 8))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">
                      ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs uppercase font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {p.payment_method?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono text-slate-600 font-semibold">
                      {p.transaction_reference || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      {p.reconciliation_status?.toLowerCase() === 'reconciled' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            Reconciled
                          </span>
                          <div className="text-2xs text-slate-500 mt-1">
                            By: {p.reconciled_by || 'Staff'} • {p.reconciled_at ? new Date(p.reconciled_at).toLocaleDateString() : ''}
                          </div>
                        </div>
                      ) : p.reconciliation_status?.toLowerCase() === 'discrepancy' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Discrepancy
                          </span>
                          <div className="text-2xs text-rose-600 mt-1 max-w-xs font-medium">
                            Reason: {p.discrepancy_reason || 'Unspecified'}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {p.reconciliation_status?.toLowerCase() !== 'reconciled' && (
                        <Button
                          size="xs"
                          onClick={() => handleMarkReconciled(p.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Mark Reconciled
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleOpenFlagModal(p)}
                        className="text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        {p.reconciliation_status?.toLowerCase() === 'discrepancy' ? 'Edit Discrepancy' : 'Flag Discrepancy'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flag Discrepancy Modal */}
      {flagModalPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={handleCloseFlagModal}
            />
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-md border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-rose-50/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-bold text-slate-900">Flag Settlement Discrepancy</h3>
                </div>
                <button
                  onClick={handleCloseFlagModal}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitFlag} className="p-6 space-y-4">
                {flagError && <ErrorMessage message={flagError} />}

                <div className="text-xs bg-slate-50 p-3 rounded-lg space-y-1 text-slate-600">
                  <div>
                    Receipt: <strong className="text-slate-900">{flagModalPayment.receipt_number}</strong>
                  </div>
                  <div>
                    Student: <strong className="text-slate-900">{flagModalPayment.student_name}</strong>
                  </div>
                  <div>
                    Amount: <strong className="text-slate-900">₹{flagModalPayment.amount.toLocaleString('en-IN')}</strong> via {flagModalPayment.payment_method}
                  </div>
                  <div>
                    Reference: <strong className="font-mono text-slate-900">{flagModalPayment.transaction_reference || 'N/A'}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Discrepancy Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe discrepancy (e.g., UTR not found on bank portal, amount mismatch of ₹500, check bounced)..."
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-900"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCloseFlagModal}
                    disabled={isSubmittingFlag}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingFlag}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {isSubmittingFlag ? 'Flagging...' : 'Save Discrepancy'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

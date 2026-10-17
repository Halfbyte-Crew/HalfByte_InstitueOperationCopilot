import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Receipt,
  CreditCard,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/common/EmptyState';
import { ErrorMessage } from '../../../../components/common/ErrorMessage';
import { getFinancePayments } from '../../dashboardApi';

const PAYMENT_METHODS = [
  { id: 'all', label: 'All Methods' },
  { id: 'upi', label: 'UPI' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' },
];

const RECON_STATUSES = [
  { id: 'all', label: 'All Reconciliation' },
  { id: 'reconciled', label: 'Reconciled' },
  { id: 'unreconciled', label: 'Unreconciled' },
  { id: 'discrepancy', label: 'Discrepancy' },
];

export function FinancePaymentsView({ onOpenRecordPayment, onOpenReceipt }) {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [reconFilter, setReconFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        page_size: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (methodFilter !== 'all') params.payment_method = methodFilter;
      if (reconFilter !== 'all') params.reconciliation_status = reconFilter;

      const data = await getFinancePayments(params);
      setPayments(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load payment transactions');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, methodFilter, reconFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const getReconBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'reconciled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" />
            Reconciled
          </span>
        );
      case 'discrepancy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" />
            Discrepancy
          </span>
        );
      case 'unreconciled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Unreconciled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payment Records</h2>
          <p className="text-sm text-slate-500">
            Real-time ledger of recorded payments, transaction receipts, settlement statuses, and audit trails.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayments}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenRecordPayment && onOpenRecordPayment()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student, receipt #, UTR, or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={reconFilter}
              onChange={(e) => {
                setReconFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              {RECON_STATUSES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>

            <Button type="submit" size="sm" variant="outline" className="text-xs">
              Search
            </Button>
          </div>
        </form>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Receipt #</th>
                <th className="px-4 py-3.5">Student</th>
                <th className="px-4 py-3.5">Payment Date</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Reference / UTR</th>
                <th className="px-4 py-3.5">EMI / Course</th>
                <th className="px-4 py-3.5">Reconciliation</th>
                <th className="px-4 py-3.5">Recorded By</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12">
                    <EmptyState
                      title="No Payment Records Found"
                      description="No payments match your current query or filters."
                    />
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-700 text-xs">
                      {p.receipt_number}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{p.student_name}</div>
                      <div className="text-2xs text-slate-400 font-mono">
                        {p.student_code || p.student_email || ('ID: ' + String(p.student_id).slice(0, 8))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">
                      ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs uppercase font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {p.payment_method?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono text-slate-600">
                      {p.transaction_reference || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <div className="font-medium text-slate-800">
                        {p.installment_title || (p.installment_number ? `EMI #${p.installment_number}` : 'Course Fee')}
                      </div>
                      <div className="text-2xs text-slate-400 truncate max-w-[140px]">
                        {p.course_name || 'Enrolled Course'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {getReconBadge(p.reconciliation_status)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {p.recorded_by || p.recorded_by_name || 'Staff'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => onOpenReceipt && onOpenReceipt(p.id)}
                        className="flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing {payments.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(page * pageSize, total)} of {total} payments
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" />
              Previous
            </Button>
            <span className="font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || isLoading}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

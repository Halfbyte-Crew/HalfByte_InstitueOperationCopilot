import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/common/EmptyState';
import { ErrorMessage } from '../../../../components/common/ErrorMessage';
import { getFinanceFees } from '../../dashboardApi';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Statuses' },
  { id: 'Overdue', label: 'Overdue' },
  { id: 'Partially Paid', label: 'Partially Paid' },
  { id: 'Upcoming', label: 'Upcoming' },
  { id: 'Paid', label: 'Paid' },
  { id: 'Pending Verification', label: 'Pending Verification' },
];

const DUE_RANGE_FILTERS = [
  { id: 'all', label: 'Any Due Date' },
  { id: 'overdue', label: 'Overdue Only' },
  { id: 'next_7_days', label: 'Due Next 7 Days' },
  { id: 'next_30_days', label: 'Due Next 30 Days' },
];

export function FinanceFeesEmisView({ onOpenRecordPayment }) {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  const initialDueRange = searchParams.get('due_range') || 'all';

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [dueRangeFilter, setDueRangeFilter] = useState(initialDueRange);
  const [sortBy, setSortBy] = useState('due_date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dueRangeFilter !== 'all') params.due_range = dueRangeFilter;

      const data = await getFinanceFees(params);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Error fetching fees:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load fees and installments');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, statusFilter, dueRangeFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFees();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const getStatusBadge = (status, isOverdue) => {
    if (isOverdue || status === 'Overdue') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3" />
          Overdue
        </span>
      );
    }
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" />
            Paid
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3 h-3" />
            Partial
          </span>
        );
      case 'Upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Upcoming
          </span>
        );
      case 'Pending Verification':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <AlertCircle className="w-3 h-3" />
            Pending Verification
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fees & EMI Management</h2>
          <p className="text-sm text-slate-500">
            Track student fee plans, upcoming instalments, overdue balances, and record collections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFees}
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
            <CreditCard className="w-3.5 h-3.5" />
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
              placeholder="Search by student name or student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={dueRangeFilter}
              onChange={(e) => {
                setDueRangeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              {DUE_RANGE_FILTERS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>

            <Button type="submit" size="sm" variant="outline" className="text-xs">
              Apply
            </Button>
          </div>
        </form>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Student & Course</th>
                <th className="px-4 py-3.5">Instalment #</th>
                <th className="px-4 py-3.5">Total Course Fee</th>
                <th className="px-4 py-3.5">Instalment Due</th>
                <th className="px-4 py-3.5">Amount Paid</th>
                <th
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('balance_due')}
                >
                  <div className="flex items-center gap-1">
                    <span>Balance</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('due_date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Due Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12">
                    <EmptyState
                      title="No Fee Records Found"
                      description="No installments or fee plans match your current filters."
                    />
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const balance = Number(row.balance_due ?? row.outstanding_balance ?? 0);
                  const amountDue = Number(row.amount_due ?? 0);
                  const amountPaid = Number(row.amount_paid ?? 0);
                  const totalCourseFee = Number(row.total_course_fee ?? (amountDue + amountPaid));
                  const installmentDesc = row.title || (row.installment_number ? `EMI #${row.installment_number}` : 'Fee Instalment');
                  const courseDesc = row.course_name || row.course_title || 'Enrolled Program';
                  const studentCode = row.student_code || row.student_email || ('ID: ' + String(row.student_id).slice(0, 8));

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{row.student_name}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {studentCode} • {courseDesc}
                        </div>
                        {row.batch_name && (
                          <div className="text-xs text-indigo-600 font-medium">{row.batch_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-700">{installmentDesc}</span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        ₹{totalCourseFee.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        ₹{amountDue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-emerald-600">
                        ₹{amountPaid.toLocaleString('en-IN')}
                        {row.last_payment_date && (
                          <div className="text-2xs text-slate-400">
                            Last: {new Date(row.last_payment_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-semibold ${
                            balance > 0 ? 'text-rose-600' : 'text-slate-500'
                          }`}
                        >
                          ₹{balance.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-800 font-medium">
                          {row.due_date ? new Date(row.due_date).toLocaleDateString() : '—'}
                        </div>
                        {row.is_overdue && (
                          <div className="text-2xs font-semibold text-rose-600">
                            {row.days_overdue} days overdue
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(row.status, row.is_overdue)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {balance > 0 ? (
                          <Button
                            size="xs"
                            onClick={() =>
                              onOpenRecordPayment &&
                              onOpenRecordPayment({
                                student_id: row.student_id,
                                installment_id: row.id,
                                balance_due: balance,
                              })
                            }
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                          >
                            Collect
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing {items.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(page * pageSize, total)} of {total} records
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

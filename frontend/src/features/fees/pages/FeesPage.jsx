import React, { useState, useCallback } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Table } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import {
  CreditCard, RefreshCw, AlertCircle, TrendingUp,
  IndianRupee, CheckCircle2, Clock3, Banknote,
} from 'lucide-react';
import { useApi, useMutation } from '../../../hooks';
import { feesApi } from '../feesApi';
import { studentsApi } from '../../students/studentsApi';

const FEE_STATUS_VARIANT = {
  pending: 'warning',
  paid: 'success',
  partially_paid: 'info',
  overdue: 'danger',
  waived: 'default',
};

function currency(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);
}

export function FeesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payError, setPayError] = useState('');

  const fetchFees = useCallback(
    () => feesApi.getFees(statusFilter ? { status: statusFilter } : {}),
    [statusFilter]
  );
  const { data: fees = [], isLoading, error, execute: refresh } = useApi(fetchFees, [statusFilter]);
  const { data: overview } = useApi(() => feesApi.getFeeOverview(), []);

  // Lazy load students map for name display
  const { data: students = [] } = useApi(() => studentsApi.getStudents({ limit: 100 }), []);
  const studentMap = React.useMemo(() => {
    const m = {};
    students.forEach((s) => { m[s.id] = s; });
    return m;
  }, [students]);

  const { mutate: recordPayment, isLoading: isPaying } = useMutation(
    ({ id, amount }) => feesApi.recordPayment(id, { payment_amount: parseFloat(amount) })
  );

  const openPayModal = (row) => {
    setSelectedInstallment(row);
    setPayAmount('');
    setPayError('');
    setIsPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!payAmount || isNaN(amt) || amt <= 0) {
      setPayError('Enter a valid payment amount.');
      return;
    }
    const remaining = Number(selectedInstallment.amount_due) - Number(selectedInstallment.amount_paid);
    if (amt > remaining) {
      setPayError(`Amount exceeds outstanding balance of ${currency(remaining)}.`);
      return;
    }
    try {
      await recordPayment({ id: selectedInstallment.id, amount: amt });
      setIsPayModalOpen(false);
      refresh();
    } catch (err) {
      setPayError(err.message || 'Payment recording failed.');
    }
  };

  const columns = [
    {
      header: 'Student',
      key: 'student_id',
      render: (row) => {
        const s = studentMap[row.student_id];
        return (
          <div>
            <div className="font-semibold text-slate-900">{s?.name || 'Unknown'}</div>
            <div className="text-xs text-slate-500">{s?.email || row.student_id}</div>
          </div>
        );
      },
    },
    {
      header: 'Amount Due',
      key: 'amount_due',
      render: (row) => <span className="font-semibold text-slate-800">{currency(row.amount_due)}</span>,
    },
    {
      header: 'Amount Paid',
      key: 'amount_paid',
      render: (row) => (
        <span className={`font-semibold ${Number(row.amount_paid) > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
          {currency(row.amount_paid)}
        </span>
      ),
    },
    {
      header: 'Outstanding',
      key: 'outstanding',
      render: (row) => {
        const bal = Number(row.amount_due) - Number(row.amount_paid);
        return (
          <span className={`font-semibold ${bal > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {currency(bal)}
          </span>
        );
      },
    },
    {
      header: 'Due Date',
      key: 'due_date',
      render: (row) =>
        row.due_date ? new Date(row.due_date).toLocaleDateString('en-IN') : '—',
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <Badge variant={FEE_STATUS_VARIANT[row.status] || 'default'}>
          {row.status?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: '',
      key: 'actions',
      render: (row) =>
        row.status !== 'paid' && row.status !== 'waived' ? (
          <Button size="sm" variant="outline" onClick={() => openPayModal(row)}>
            Record Payment
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Fee Management & Invoicing"
        description="Track installments, record payments, and monitor outstanding balances."
        action={
          <Button variant="secondary" icon={RefreshCw} onClick={() => refresh()} isLoading={isLoading}>
            Refresh
          </Button>
        }
      />

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Receivable', value: currency(overview.total_receivable), icon: IndianRupee, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
            { label: 'Total Collected', value: currency(overview.total_collected), icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
            { label: 'Outstanding', value: currency(overview.total_outstanding), icon: Clock3, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
            { label: 'Collection Rate', value: overview.collection_rate, icon: TrendingUp, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-xl border ${bg} p-4 flex items-center gap-3`}>
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['', 'pending', 'partially_paid', 'paid', 'overdue', 'waived'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s ? s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Table
        columns={columns}
        data={fees}
        isLoading={isLoading}
        emptyMessage="No fee records found for the selected filter."
      />

      {/* Record Payment Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Record Payment">
        {selectedInstallment && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Student</span>
                <span className="font-semibold text-slate-800">
                  {studentMap[selectedInstallment.student_id]?.name || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Due</span>
                <span className="font-semibold">{currency(selectedInstallment.amount_due)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already Paid</span>
                <span className="font-semibold text-emerald-600">{currency(selectedInstallment.amount_paid)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                <span className="text-slate-700 font-medium">Outstanding</span>
                <span className="font-bold text-rose-600">
                  {currency(Number(selectedInstallment.amount_due) - Number(selectedInstallment.amount_paid))}
                </span>
              </div>
            </div>

            <Input
              label="Payment Amount (₹)"
              type="number"
              required
              min="1"
              step="0.01"
              placeholder="Enter amount to record…"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />

            {payError && <p className="text-sm text-rose-600">{payError}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setIsPayModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isPaying}>
                <Banknote className="h-4 w-4 mr-1.5" />
                Record Payment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

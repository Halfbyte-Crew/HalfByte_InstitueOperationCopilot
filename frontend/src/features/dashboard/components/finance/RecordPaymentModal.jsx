import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle, CheckCircle, Receipt, User, Clock } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { ErrorMessage } from '../../../../components/common/ErrorMessage';
import { getFinanceStudents, recordFinancePayment } from '../../dashboardApi';

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI / QR' },
  { id: 'Bank Transfer', label: 'Bank Transfer (NEFT/IMPS)' },
  { id: 'Cash', label: 'Cash Counter' },
  { id: 'Card', label: 'Credit / Debit Card' },
];

export function RecordPaymentModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedInstallmentId, setSelectedInstallmentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchStudents();
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const data = await getFinanceStudents();
      const list = Array.isArray(data) ? data : data.students || [];
      setStudents(list);

      // Pre-select if initialData provided
      if (initialData?.student_id) {
        const sId = String(initialData.student_id);
        setSelectedStudentId(sId);
        if (initialData?.installment_id) {
          setSelectedInstallmentId(String(initialData.installment_id));
        }
        if (initialData?.balance_due) {
          setAmount(String(Number(initialData.balance_due)));
        }
      } else if (list.length > 0) {
        setSelectedStudentId(String(list[0].id));
      }
    } catch (err) {
      console.error('Failed to load students with dues:', err);
      setError('Could not load student list with unpaid fees.');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const currentStudent = students.find((s) => String(s.id) === String(selectedStudentId));
  const unpaidInstallments =
    currentStudent?.unpaid_installments || currentStudent?.pending_installments || [];

  // When student changes, update selected installment
  useEffect(() => {
    if (currentStudent && unpaidInstallments.length > 0) {
      if (!unpaidInstallments.some((inst) => String(inst.id) === String(selectedInstallmentId))) {
        const first = unpaidInstallments[0];
        setSelectedInstallmentId(String(first.id));
        const firstBal = Number(first.balance_due ?? first.outstanding_balance ?? 0);
        setAmount(String(firstBal));
      }
    }
  }, [selectedStudentId, currentStudent, unpaidInstallments]);

  const selectedInstallment = unpaidInstallments.find(
    (inst) => String(inst.id) === String(selectedInstallmentId)
  );

  const selectedBalance = selectedInstallment
    ? Number(selectedInstallment.balance_due ?? selectedInstallment.outstanding_balance ?? 0)
    : 0;

  const handleInstallmentChange = (instId) => {
    setSelectedInstallmentId(instId);
    const inst = unpaidInstallments.find((i) => String(i.id) === String(instId));
    if (inst) {
      const bal = Number(inst.balance_due ?? inst.outstanding_balance ?? 0);
      setAmount(String(bal));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (selectedInstallment && numAmount > selectedBalance + 0.01) {
      setError(
        `Amount (₹${numAmount.toLocaleString('en-IN')}) cannot exceed installment balance of ₹${selectedBalance.toLocaleString('en-IN')}.`
      );
      return;
    }

    if (paymentMethod !== 'Cash' && paymentMethod !== 'cash' && !reference.trim()) {
      setError('Transaction reference (UTR / Receipt / Bank Ref) is required for non-cash payments.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        student_id: selectedStudentId,
        installment_id: selectedInstallmentId || undefined,
        amount: numAmount,
        payment_method: paymentMethod,
        transaction_reference: reference.trim() || undefined,
        payment_date: paymentDate ? paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
        notes: notes.trim() || undefined,
      };

      const result = await recordFinancePayment(payload);
      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err) {
      console.error('Error recording payment:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-xl border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Fee Collection</h3>
                <p className="text-xs text-slate-500">Record real-time payment against student instalment</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <ErrorMessage message={error} />}

            {/* Student Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select Student <span className="text-rose-500">*</span>
              </label>
              {isLoadingStudents ? (
                <div className="h-10 bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  required
                >
                  <option value="">-- Choose a student with outstanding dues --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.student_id || s.email || 'ID: ' + s.id}) — {s.course_name || 'Enrolled'} (Pending: ₹
                      {Number(s.total_unpaid || 0).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Installment Selector */}
            {currentStudent && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Pending Instalment <span className="text-rose-500">*</span>
                </label>
                {unpaidInstallments.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    This student has no pending instalments remaining.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={selectedInstallmentId}
                      onChange={(e) => handleInstallmentChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                      required
                    >
                      {unpaidInstallments.map((inst) => {
                        const bal = Number(inst.balance_due ?? inst.outstanding_balance ?? 0);
                        const due = Number(inst.amount_due ?? 0);
                        const desc = inst.title || (inst.installment_number ? `EMI #${inst.installment_number}` : 'Instalment');
                        return (
                          <option key={inst.id} value={inst.id}>
                            {desc} • Due: {inst.due_date ? new Date(inst.due_date).toLocaleDateString() : 'N/A'} • Due: ₹{due.toLocaleString('en-IN')} (Remaining: ₹{bal.toLocaleString('en-IN')})
                          </option>
                        );
                      })}
                    </select>

                    {selectedInstallment && (
                      <div className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-600">
                          Instalment Total: <strong className="text-slate-900">₹{Number(selectedInstallment.amount_due || 0).toLocaleString('en-IN')}</strong>
                        </span>
                        <span className="text-rose-700 font-semibold">
                          Outstanding Balance: ₹{selectedBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Payment Amount & Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Amount Received (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  required
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transaction Reference & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reference / UTR Number {paymentMethod !== 'Cash' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={paymentMethod === 'Cash' ? 'Optional counter receipt #' : 'e.g. UTR123456789 / UPI-REF'}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  required={paymentMethod !== 'Cash'}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Internal Notes / Remarks
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes regarding this payment or discount agreement..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !selectedInstallmentId || unpaidInstallments.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                {isSubmitting ? 'Recording...' : 'Record Payment & Generate Receipt'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

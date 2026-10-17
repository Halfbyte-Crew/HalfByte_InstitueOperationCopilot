import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle, GraduationCap, Building2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { getFinanceReceipt } from '../../dashboardApi';

export function PaymentReceiptModal({ isOpen, onClose, paymentId }) {
  const [receipt, setReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && paymentId) {
      fetchReceipt();
    }
  }, [isOpen, paymentId]);

  const fetchReceipt = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getFinanceReceipt(paymentId);
      setReceipt(data);
    } catch (err) {
      console.error('Error fetching receipt:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const studentName = receipt?.student_name || receipt?.student?.name || 'Enrolled Student';
  const studentCode = receipt?.student_code || receipt?.student?.email || receipt?.student?.id || 'N/A';
  const studentEmail = receipt?.student_email || receipt?.student?.email || '';
  const courseTitle = receipt?.course_name || receipt?.course_title || 'Institute Programme';
  const installmentTitle =
    receipt?.installment?.title ||
    (receipt?.installment_number ? `Fee Instalment #${receipt.installment_number}` : 'Course Fee Payment');
  const amountPaid = Number(receipt?.amount_paid ?? 0);
  const remainingBalance = Number(
    receipt?.installment_balance_remaining ?? receipt?.installment?.remaining_balance ?? 0
  );
  const totalFee = Number(receipt?.total_course_fee ?? (amountPaid + remainingBalance));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity print:hidden"
          onClick={onClose}
        />
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-2xl border border-slate-200 print:border-none print:shadow-none print:w-full print:max-w-none">
          {/* Header Controls (Hidden on print) */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50 print:hidden">
            <h3 className="text-base font-bold text-slate-900">Official Payment Receipt</h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                Print Receipt
              </Button>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Printable Receipt Body */}
          <div className="p-8 space-y-6 print:p-0">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 animate-pulse">
                Loading official receipt...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-rose-600 text-sm">{error}</div>
            ) : receipt ? (
              <div className="space-y-6 border border-slate-200 p-6 rounded-xl print:border-none print:p-0">
                {/* Institute Banner */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-900">EduPilot Institute</h1>
                      <p className="text-xs text-slate-500">Institute Operations & Professional Academy</p>
                      <p className="text-2xs text-slate-400">Official Fee Acknowledgment Receipt</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md inline-block font-mono">
                      {receipt.receipt_number}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Date: {receipt.payment_date ? new Date(receipt.payment_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }) : '—'}
                    </div>
                  </div>
                </div>

                {/* Student & Course Details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-slate-400 font-semibold uppercase tracking-wider text-2xs">
                      Billed Student
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{studentName}</div>
                    <div className="text-slate-600 font-mono">
                      ID: {studentCode}
                    </div>
                    {studentEmail && (
                      <div className="text-slate-500">{studentEmail}</div>
                    )}
                  </div>

                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-slate-400 font-semibold uppercase tracking-wider text-2xs">
                      Enrolled Program
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{courseTitle}</div>
                    {receipt.batch_name && (
                      <div className="text-indigo-600 font-medium">{receipt.batch_name}</div>
                    )}
                    <div className="text-slate-600">
                      Total Course Fee: ₹{totalFee.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Line Item Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Description</th>
                        <th className="p-3">Payment Method</th>
                        <th className="p-3">Reference / UTR</th>
                        <th className="p-3 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 font-medium text-slate-900">
                          {installmentTitle}
                        </td>
                        <td className="p-3 uppercase text-slate-600 font-semibold">
                          {receipt.payment_method?.replace('_', ' ')}
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {receipt.transaction_reference || 'N/A'}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 text-sm">
                          ₹{amountPaid.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div className="flex justify-between items-end pt-2">
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>
                      Recorded by: <strong className="text-slate-700">{receipt.recorded_by}</strong>
                    </div>
                    {receipt.notes && (
                      <div className="italic text-slate-400">Notes: "{receipt.notes}"</div>
                    )}
                  </div>
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Amount Paid:</span>
                      <span className="font-bold text-emerald-600 text-sm">
                        ₹{amountPaid.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                      <span>Remaining Instalment Due:</span>
                      <span
                        className={`font-semibold ${
                          remainingBalance > 0
                            ? 'text-rose-600'
                            : 'text-slate-600'
                        }`}
                      >
                        ₹{remainingBalance.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Seal */}
                <div className="pt-6 border-t border-dashed border-slate-200 flex items-center justify-between text-2xs text-slate-400">
                  <div>
                    This is an electronically generated receipt verified by EduPilot Finance Module.
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verified & Recorded
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

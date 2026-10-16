import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { EmptyState } from '../../../components/common/EmptyState';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { CreditCard, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import { dashboardApi } from '../dashboardApi';

const INSTALLMENT_STATUS = {
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  overdue: { label: 'Overdue', className: 'bg-rose-50 text-rose-700 border-rose-100' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  partially_paid: { label: 'Partial', className: 'bg-sky-50 text-sky-700 border-sky-100' },
};

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded" /></td>
      ))}
    </tr>
  );
}

export function AccountsDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useApi(dashboardApi.getAccountsOverview);
  const counts = data?.installment_counts ?? {};

  const kpis = [
    { label: 'Total Receivable', value: data ? `₹${Number(data.total_receivable).toLocaleString('en-IN')}` : '—', icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Collected', value: data ? `₹${Number(data.total_collected).toLocaleString('en-IN')}` : '—', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Outstanding', value: data ? `₹${Number(data.total_outstanding).toLocaleString('en-IN')}` : '—', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Collection Rate', value: data?.collection_rate ?? '—', icon: TrendingUp, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  const statusBreakdown = [
    { label: 'Paid', count: counts.paid ?? 0, icon: CheckCircle, className: 'text-emerald-600 bg-emerald-50' },
    { label: 'Pending', count: counts.pending ?? 0, icon: Clock, className: 'text-amber-600 bg-amber-50' },
    { label: 'Overdue', count: counts.overdue ?? 0, icon: AlertCircle, className: 'text-rose-600 bg-rose-50' },
    { label: 'Partially Paid', count: counts.partially_paid ?? 0, icon: CreditCard, className: 'text-sky-600 bg-sky-50' },
  ];

  return (
    <div>
      <PageHeader
        title="Accounts Dashboard"
        description="Fee collections, outstanding balances, and payment reconciliation."
        action={
          <Button variant="primary" icon={CreditCard} onClick={() => navigate('/fees')}>
            Record Payment
          </Button>
        }
      />

      {error && <ErrorMessage message={error} className="mb-6" />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-8 bg-slate-100 rounded w-1/2" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{k.label}</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{k.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${k.bg} ${k.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {statusBreakdown.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`flex items-center gap-3 rounded-xl p-4 border border-slate-200 bg-white shadow-xs`}>
              <div className={`p-2 rounded-lg ${s.className}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-900">
                  {isLoading ? <span className="inline-block h-5 w-8 bg-slate-100 rounded animate-pulse" /> : s.count}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent installments table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Installments</h2>
          <Button size="sm" variant="outline" onClick={() => navigate('/fees')}>View All Fees</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Due</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? [1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)
                : data?.recent_installments?.length > 0
                ? data.recent_installments.map((inst) => {
                    const st = INSTALLMENT_STATUS[inst.status] ?? { label: inst.status, className: 'bg-slate-50 text-slate-600 border-slate-200' };
                    return (
                      <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{inst.student_name}</td>
                        <td className="px-4 py-3 text-right text-slate-700">₹{Number(inst.amount_due).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-emerald-700">₹{Number(inst.amount_paid).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {inst.due_date ? new Date(inst.due_date).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${st.className}`}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12">
                      <EmptyState
                        title="No fee records"
                        description="Fee installments will appear here once created."
                      />
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

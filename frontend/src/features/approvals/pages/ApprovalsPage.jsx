import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { EmptyState } from '../../../components/common/EmptyState';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Plus,
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { useApi, useMutation } from '../../../hooks';
import { approvalsApi } from '../approvalsApi';

const TYPE_STYLE = {
  BATCH_TRANSFER: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  FEE_CONCESSION: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  LEAVE_REQUEST: 'bg-purple-100 text-purple-800 border-purple-200',
  SCHEDULE_CHANGE: 'bg-amber-100 text-amber-800 border-amber-200',
  ATTENDANCE_CORRECTION: 'bg-sky-100 text-sky-800 border-sky-200',
};

const EMPTY_REQUEST = {
  request_type: 'BATCH_TRANSFER',
  title: '',
  description: '',
  requester_name: '',
  requester_email: '',
  requester_role: 'counselor',
};

export function ApprovalsPage() {
  const [statusFilter, setStatusFilter] = useState('Pending');

  // Modals
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState(EMPTY_REQUEST);
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [modalError, setModalError] = useState('');

  const fetchApprovals = useCallback(() => {
    return approvalsApi.getApprovals(statusFilter !== 'all' ? { status: statusFilter } : {});
  }, [statusFilter]);

  const {
    data: approvalsRaw,
    isLoading,
    error,
    execute: refetchList,
  } = useApi(fetchApprovals, [statusFilter], { initialData: [] });
  const approvals = Array.isArray(approvalsRaw) ? approvalsRaw : [];

  const {
    data: counts,
    execute: refetchCounts,
  } = useApi(approvalsApi.getApprovalCounts);

  const { mutate: approve, isLoading: isApproving } = useMutation(approvalsApi.approveRequest);
  const { mutate: reject, isLoading: isRejecting } = useMutation((payload) =>
    approvalsApi.rejectRequest(payload.id, payload.reason)
  );
  const { mutate: createRequest, isLoading: isCreating } = useMutation(approvalsApi.createApproval);

  const refreshAll = useCallback(() => {
    refetchList();
    refetchCounts();
  }, [refetchList, refetchCounts]);

  const handleApprove = async (approval) => {
    if (!window.confirm(`Approve request '${approval.title}'? This action will be audited.`)) {
      return;
    }
    try {
      await approve(approval.id);
      setFeedback({ text: `Approved: '${approval.title}' successfully.`, type: 'success' });
      refreshAll();
    } catch (err) {
      setFeedback({ text: err.message || 'Failed to approve request.', type: 'error' });
    }
  };

  const handleOpenReject = (approval) => {
    setRejectingItem(approval);
    setRejectReason('');
    setModalError('');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingItem) return;

    try {
      await reject({ id: rejectingItem.id, reason: rejectReason.trim() });
      setFeedback({ text: `Rejected request: '${rejectingItem.title}'.`, type: 'success' });
      setRejectingItem(null);
      refreshAll();
    } catch (err) {
      setModalError(err.message || 'Failed to reject request.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!newRequest.title || !newRequest.description || !newRequest.requester_name || !newRequest.requester_email) {
      setModalError('Please fill in all required fields.');
      return;
    }

    try {
      await createRequest(newRequest);
      setFeedback({ text: 'Approval request submitted successfully.', type: 'success' });
      setIsSubmitModalOpen(false);
      setNewRequest(EMPTY_REQUEST);
      refreshAll();
    } catch (err) {
      setModalError(err.message || 'Failed to submit request.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative Approvals Center"
        description="Review, authorize, or reject critical institutional requests (batch transfers, fee concessions, and faculty leaves)."
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={refreshAll}>
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsSubmitModalOpen(true)}
            >
              Submit Request
            </Button>
          </div>
        }
      />

      {feedback.text && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback({ text: '', type: '' })}
            className="text-slate-400 hover:text-slate-600 text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* Filter Tabs & Counters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {['Pending', 'Approved', 'Rejected', 'all'].map((tab) => {
            const isActive = statusFilter.toLowerCase() === tab.toLowerCase();
            const count =
              tab === 'Pending'
                ? counts?.pending
                : tab === 'Approved'
                ? counts?.approved
                : tab === 'Rejected'
                ? counts?.rejected
                : counts?.total;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="capitalize">{tab === 'all' ? 'All Requests' : tab}</span>
                {count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-indigo-700/60 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : approvals.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={`No ${statusFilter === 'all' ? '' : statusFilter} Requests`}
            description="There are currently no requests in this status category."
          />
        ) : (
          approvals.map((req) => (
            <div
              key={req.id}
              className={`rounded-xl border bg-white p-5 shadow-xs transition-all ${
                req.status === 'Pending'
                  ? 'border-amber-200 bg-amber-50/20'
                  : req.status === 'Approved'
                  ? 'border-emerald-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        TYPE_STYLE[req.request_type] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {req.request_type.replace('_', ' ')}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{req.title}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        req.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{req.description}</p>

                  {/* Payload Summary (if present) */}
                  {req.payload && Object.keys(req.payload).length > 0 && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Request Parameters:
                      </span>
                      {Object.entries(req.payload).map(([k, v]) => (
                        <span key={k} className="inline-block mr-4">
                          <span className="text-slate-500 font-semibold">{k}:</span> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <User className="h-3 w-3 text-slate-400" />
                      {req.requester_name} ({req.requester_role})
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      Submitted: {new Date(req.created_at).toLocaleString()}
                    </span>

                    {/* Audit information */}
                    {req.reviewed_by && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="flex items-center gap-1 text-indigo-700 font-medium">
                          <ShieldCheck className="h-3 w-3" />
                          Reviewed by: {req.reviewed_by}
                          {req.reviewed_at && ` on ${new Date(req.reviewed_at).toLocaleDateString()}`}
                        </span>
                      </>
                    )}

                    {req.rejection_reason && (
                      <div className="w-full text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 text-xs">
                        <strong>Rejection Reason:</strong> {req.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions for Pending */}
                {req.status === 'Pending' && (
                  <div className="flex sm:flex-col items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                      icon={CheckCircle2}
                      onClick={() => handleApprove(req)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-center text-rose-600 border-rose-200 hover:bg-rose-50"
                      icon={XCircle}
                      onClick={() => handleOpenReject(req)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectingItem && (
        <Modal
          isOpen={true}
          onClose={() => setRejectingItem(null)}
          title={`Reject Request — ${rejectingItem.title}`}
        >
          <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
            {modalError && <ErrorMessage message={modalError} />}

            <p className="text-slate-600">
              Provide an optional reason or explanation for this administrative rejection. This reason
              will be permanently recorded in the audit log.
            </p>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Reason for Rejection (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Cohort capacity exceeded or prerequisite incomplete."
                className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setRejectingItem(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700"
                loading={isRejecting}
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Submit New Request Modal (for testing & workflows) */}
      {isSubmitModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsSubmitModalOpen(false)}
          title="Submit New Approval Request"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
            {modalError && <ErrorMessage message={modalError} />}

            <div>
              <label className="block font-medium text-slate-700 mb-1">Request Type *</label>
              <select
                className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                value={newRequest.request_type}
                onChange={(e) => setNewRequest({ ...newRequest, request_type: e.target.value })}
              >
                <option value="BATCH_TRANSFER">Batch Transfer</option>
                <option value="FEE_CONCESSION">Fee Concession</option>
                <option value="LEAVE_REQUEST">Leave Request</option>
                <option value="SCHEDULE_CHANGE">Schedule Change</option>
                <option value="ATTENDANCE_CORRECTION">Attendance Correction</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                placeholder="e.g. Batch Transfer for Student #412"
                className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                value={newRequest.title}
                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Description & Justification *</label>
              <textarea
                rows={3}
                placeholder="Explain the background and operational justification..."
                className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Requester Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  value={newRequest.requester_name}
                  onChange={(e) => setNewRequest({ ...newRequest, requester_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Requester Email *</label>
                <input
                  type="email"
                  placeholder="counselor@edupilot.io"
                  className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  value={newRequest.requester_email}
                  onChange={(e) => setNewRequest({ ...newRequest, requester_email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={isCreating}>
                Submit Request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

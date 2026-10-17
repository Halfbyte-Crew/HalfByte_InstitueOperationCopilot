import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  Send,
  Building,
  ArrowRight,
  FileCheck,
  Check,
  X,
  User,
  Calendar,
  AlertTriangle,
  FileClock,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { EmptyState } from '../../../../components/common/EmptyState';
import { ErrorMessage } from '../../../../components/common/ErrorMessage';
import {
  getCounselorAdmissions,
  getCounselorAdmissionDetail,
  updateCounselorAdmissionStage,
  submitCounselorAdmissionApproval,
} from '../../dashboardApi';

const PIPELINE_STAGES = [
  'All Stages',
  'Application Started',
  'Documents Pending',
  'Documents Under Review',
  'Admission Approved',
  'Enrolled',
  'Rejected',
  'Withdrawn',
];

const STAGE_COLORS = {
  'New Enquiry': 'bg-sky-50 text-sky-700 border-sky-200',
  'Contacted': 'bg-blue-50 text-blue-700 border-blue-200',
  'Counseling Scheduled': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Application Started': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Documents Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'Documents Under Review': 'bg-orange-50 text-orange-700 border-orange-200',
  'Admission Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Enrolled': 'bg-teal-50 text-teal-700 border-teal-200',
  'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
  'Withdrawn': 'bg-slate-50 text-slate-700 border-slate-200',
};

export function CounselorAdmissionsView() {
  const [admissions, setAdmissions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [selectedStage, setSelectedStage] = useState('All Stages');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  // Detail Modal
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailDocs, setDetailDocs] = useState([]);
  const [isSavingDocs, setIsSavingDocs] = useState(false);

  // Stage Update Modal
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [admissionToUpdate, setAdmissionToUpdate] = useState(null);
  const [stageToUpdate, setStageToUpdate] = useState('');
  const [stageNotes, setStageNotes] = useState('');
  const [nextActionToUpdate, setNextActionToUpdate] = useState('');
  const [pendingReqsToUpdate, setPendingReqsToUpdate] = useState('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [stageUpdateError, setStageUpdateError] = useState(null);

  // Submit Approval Modal
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [admissionForApproval, setAdmissionForApproval] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [approvalError, setApprovalError] = useState(null);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  const fetchAdmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        page_size: limit,
      };
      if (selectedStage !== 'All Stages') {
        params.stage = selectedStage;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      const data = await getCounselorAdmissions(params);
      setAdmissions(data.items || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Error fetching admissions:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load admissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, [selectedStage, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAdmissions();
  };

  const handleOpenDetail = async (adm) => {
    setSelectedAdmission(adm);
    setDetailDocs(adm.documents_required || []);
    setIsDetailLoading(true);
    try {
      const detail = await getCounselorAdmissionDetail(adm.id);
      setSelectedAdmission(detail);
      setDetailDocs(detail.documents_required || []);
    } catch (err) {
      console.error('Error loading admission details:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleToggleDocStatus = async (index, newStatus) => {
    const updated = [...detailDocs];
    updated[index] = { ...updated[index], status: newStatus };
    setDetailDocs(updated);
    setIsSavingDocs(true);
    try {
      await updateCounselorAdmissionStage(selectedAdmission.id, {
        documents_required: updated,
      });
      setSelectedAdmission((prev) => (prev ? { ...prev, documents_required: updated } : prev));
      fetchAdmissions();
    } catch (err) {
      console.error('Failed to update document status', err);
    } finally {
      setIsSavingDocs(false);
    }
  };

  const handleOpenStageModal = (adm) => {
    setAdmissionToUpdate(adm);
    setStageToUpdate(adm.stage || adm.current_stage || 'Application Started');
    setStageNotes('');
    setNextActionToUpdate(adm.next_action || '');
    setPendingReqsToUpdate(adm.pending_requirements || '');
    setStageUpdateError(null);
    setIsStageModalOpen(true);
  };

  const handleConfirmStageUpdate = async (e) => {
    e.preventDefault();
    if (!admissionToUpdate || !stageToUpdate) return;
    setIsUpdatingStage(true);
    setStageUpdateError(null);
    try {
      const updated = await updateCounselorAdmissionStage(admissionToUpdate.id, {
        stage: stageToUpdate,
        current_stage: stageToUpdate,
        notes: stageNotes.trim() || undefined,
        next_action: nextActionToUpdate.trim() || undefined,
        pending_requirements: pendingReqsToUpdate.trim() || undefined,
      });
      setIsStageModalOpen(false);
      setAdmissionToUpdate(null);
      fetchAdmissions();
      if (selectedAdmission && selectedAdmission.id === updated.id) {
        setSelectedAdmission(updated);
      }
    } catch (err) {
      setStageUpdateError(
        err?.response?.data?.detail || err.message || 'Failed to update stage. Note: Approval requires Admin sign-off.'
      );
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleOpenApprovalModal = (adm) => {
    setAdmissionForApproval(adm);
    setApprovalNotes(
      `Candidate ${adm.student_name} has submitted required application documents for ${adm.course_title || adm.course_name}. Requesting executive admission and enrollment authorization.`
    );
    setApprovalError(null);
    setApprovalSuccess(false);
    setIsApprovalModalOpen(true);
  };

  const handleConfirmApprovalSubmit = async () => {
    if (!admissionForApproval) return;
    setIsSubmittingApproval(true);
    setApprovalError(null);
    try {
      await submitCounselorAdmissionApproval(admissionForApproval.id, {
        notes: approvalNotes.trim(),
      });
      setApprovalSuccess(true);
      setTimeout(() => {
        setIsApprovalModalOpen(false);
        setAdmissionForApproval(null);
        fetchAdmissions();
        if (selectedAdmission && selectedAdmission.id === admissionForApproval.id) {
          handleOpenDetail(admissionForApproval);
        }
      }, 1400);
    } catch (err) {
      setApprovalError(
        err?.response?.data?.detail || err.message || 'Failed to submit approval request.'
      );
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admissions Pipeline</h2>
          <p className="text-sm text-slate-500">
            Track student application progress, verify credentials, and submit completed files for Administrator authorization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAdmissions}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Pipeline Stage Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {PIPELINE_STAGES.map((stg) => {
          const isSelected = selectedStage === stg;
          return (
            <button
              key={stg}
              onClick={() => {
                setSelectedStage(stg);
                setPage(1);
              }}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {stg}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by candidate name, email, or program title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      {/* Content */}
      {error && <ErrorMessage message={error} onRetry={fetchAdmissions} />}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading admissions pipeline...</p>
        </div>
      ) : admissions.length === 0 ? (
        <EmptyState
          title="No admissions found"
          description={
            selectedStage === 'All Stages'
              ? 'No active admission applications currently assigned.'
              : `No applications found under stage "${selectedStage}".`
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {admissions.map((adm) => {
            const currentStage = adm.stage || adm.current_stage || 'Application Started';
            const courseTitle = adm.course_title || adm.course_name || 'Standard Programme';
            const appId = adm.application_number || `ADM-${String(adm.id).slice(0, 8).toUpperCase()}`;

            const docs = Array.isArray(adm.documents_required) ? adm.documents_required : [];
            const verifiedDocs = docs.filter((d) => d.status === 'Verified').length;
            const hasPendingApproval = Boolean(adm.approval_request_id && currentStage === 'Documents Under Review');
            const isApproved = currentStage === 'Admission Approved' || currentStage === 'Enrolled';

            return (
              <div
                key={adm.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <span className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {appId}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                        {adm.student_name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {adm.student_email} {adm.student_phone ? `• ${adm.student_phone}` : ''}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs font-semibold whitespace-nowrap ${
                        STAGE_COLORS[currentStage] || 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {currentStage}
                    </Badge>
                  </div>

                  {/* Course & Target */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-3 pt-1 border-t border-slate-100">
                    <p className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">{courseTitle}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Applied: {new Date(adm.application_date || adm.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>

                  {/* Document Verification Progress */}
                  {docs.length > 0 && (
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 text-xs mb-3">
                      <div className="flex justify-between text-slate-700 font-medium mb-1.5">
                        <span className="flex items-center gap-1 text-[11px]">
                          <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                          Document Verification
                        </span>
                        <span className="font-bold text-slate-800">
                          {verifiedDocs} / {docs.length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round((verifiedDocs / docs.length) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pending Requirements / Next Action */}
                  <div className="space-y-1 text-xs">
                    {adm.pending_requirements && (
                      <div className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded border border-amber-200/60">
                        <span className="font-semibold block">Pending:</span>
                        {adm.pending_requirements}
                      </div>
                    )}
                    {adm.next_action && (
                      <p className="text-[11px] text-slate-600">
                        <span className="font-medium text-slate-800">Next Action:</span> {adm.next_action}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleOpenDetail(adm)}
                    className="text-xs flex items-center gap-1 text-slate-600 hover:text-slate-900"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details & Checklist
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {/* Admin Approval submission logic */}
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Approved
                      </span>
                    ) : hasPendingApproval ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                        <FileClock className="w-3 h-3 text-orange-600" />
                        Approval Pending
                      </span>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleOpenApprovalModal(adm)}
                        className="text-xs flex items-center gap-1 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/70 border-indigo-200"
                        title="Submit verified application to Administrator for sign-off"
                      >
                        <Send className="w-3 h-3" />
                        Req Admin
                      </Button>
                    )}

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleOpenStageModal(adm)}
                      className="text-xs flex items-center gap-1 text-slate-700 hover:bg-slate-50"
                    >
                      Update Stage
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalCount > limit && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-600">
          <div>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} applications
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * limit >= totalCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ADMISSION DETAIL & DOCUMENT VERIFICATION MODAL */}
      <Modal
        isOpen={Boolean(selectedAdmission) && !isStageModalOpen && !isApprovalModalOpen}
        onClose={() => setSelectedAdmission(null)}
        title="Admission Application File"
        maxWidth="max-w-2xl"
      >
        {selectedAdmission && (
          <div className="p-6 space-y-5">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                  {selectedAdmission.application_number || `ADM-${String(selectedAdmission.id).slice(0, 8).toUpperCase()}`}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1.5">
                  {selectedAdmission.student_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedAdmission.student_email} • {selectedAdmission.student_phone || 'No phone'}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={`text-xs font-semibold ${
                  STAGE_COLORS[selectedAdmission.stage || selectedAdmission.current_stage] || ''
                }`}
              >
                {selectedAdmission.stage || selectedAdmission.current_stage}
              </Badge>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-500 block mb-0.5">Program</span>
                <span className="font-semibold text-slate-900">
                  {selectedAdmission.course_title || selectedAdmission.course_name}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Application Date</span>
                <span className="font-semibold text-slate-900">
                  {new Date(selectedAdmission.application_date || selectedAdmission.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Assigned Counselor</span>
                <span className="font-semibold text-slate-900">
                  {selectedAdmission.assigned_counselor_email}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Administrator Decision</span>
                <span className="font-semibold text-slate-900">
                  {selectedAdmission.approval_status || (selectedAdmission.approval_request_id ? 'In Review' : 'Not Requested')}
                </span>
              </div>
            </div>

            {/* Interactive Document Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Required Documents Checklist
                </h4>
                {isSavingDocs && (
                  <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                )}
              </div>
              {detailDocs.length > 0 ? (
                <div className="space-y-2">
                  {detailDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200/80 bg-white text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileCheck className="w-4 h-4 text-slate-500" />
                        <span className="font-semibold text-slate-800">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {['Pending', 'Received', 'Verified'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            disabled={isSavingDocs}
                            onClick={() => handleToggleDocStatus(idx, st)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                              doc.status === st
                                ? st === 'Verified'
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : st === 'Received'
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-amber-600 text-white border-amber-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No checklist requirements recorded.</p>
              )}
            </div>

            {/* Interaction / Activity History */}
            {selectedAdmission.interactions && selectedAdmission.interactions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Interaction History
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedAdmission.interactions.map((it) => (
                    <div
                      key={it.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 text-xs"
                    >
                      <div className="flex justify-between font-semibold text-slate-800 mb-0.5">
                        <span>{it.interaction_type}: {it.summary}</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          {new Date(it.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {it.details && <p className="text-slate-600 text-[11px] mt-0.5">{it.details}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAdmission(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenStageModal(selectedAdmission)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Update Stage & Next Action
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* UPDATE STAGE MODAL */}
      <Modal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        title="Update Admission Progress"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmStageUpdate} className="p-6 space-y-4">
          {stageUpdateError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed">
              {stageUpdateError}
            </div>
          )}

          <p className="text-xs text-slate-600">
            Updating operational progress for <span className="font-semibold text-slate-900">{admissionToUpdate?.student_name}</span>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Admission Stage <span className="text-rose-500">*</span>
            </label>
            <select
              value={stageToUpdate}
              onChange={(e) => setStageToUpdate(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="Application Started">Application Started</option>
              <option value="Documents Pending">Documents Pending</option>
              <option value="Documents Under Review">Documents Under Review</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Institutional policy requires Administrator authorization for official enrollment and admission approval. To request sign-off, use "Req Admin".
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Next Action Required</label>
            <input
              type="text"
              placeholder="e.g. Call candidate regarding degree certificate..."
              value={nextActionToUpdate}
              onChange={(e) => setNextActionToUpdate(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Outstanding Requirements</label>
            <input
              type="text"
              placeholder="e.g. Identity proof and degree marksheets outstanding"
              value={pendingReqsToUpdate}
              onChange={(e) => setPendingReqsToUpdate(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Counselor Note / Reason</label>
            <textarea
              rows={2}
              placeholder="Record reason or milestone updates..."
              value={stageNotes}
              onChange={(e) => setStageNotes(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsStageModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isUpdatingStage}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isUpdatingStage ? 'Saving...' : 'Save Updates'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* SUBMIT ADMIN APPROVAL MODAL */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title="Submit for Administrator Approval"
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          {approvalSuccess ? (
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-semibold text-emerald-900">
                Approval Request Submitted!
              </h4>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Application stage transitioned to "Documents Under Review". The request is now queued on the Administrator's approvals desk.
              </p>
            </div>
          ) : (
            <>
              {approvalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed">
                  {approvalError}
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                Counselors cannot directly finalize official admission or enrollment without executive sign-off. Submit this request for institute Administrator authorization:
              </p>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/90 text-xs space-y-1.5">
                <p>
                  <span className="font-semibold text-slate-700">Applicant:</span>{' '}
                  {admissionForApproval?.student_name}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Program:</span>{' '}
                  {admissionForApproval?.course_title || admissionForApproval?.course_name}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Application #:</span>{' '}
                  {admissionForApproval?.application_number || `ADM-${String(admissionForApproval?.id).slice(0, 8).toUpperCase()}`}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Counselor Verification Summary & Recommendations
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsApprovalModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmittingApproval}
                  onClick={handleConfirmApprovalSubmit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingApproval ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  Calendar,
  FileCheck2,
  MessageSquare,
  Clock,
  ArrowRight,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { EmptyState } from '../../../../components/common/EmptyState';
import { ErrorMessage } from '../../../../components/common/ErrorMessage';
import { dashboardApi } from '../../dashboardApi';

const STATUS_BADGES = {
  'New': 'bg-sky-50 text-sky-700 border-sky-200',
  'Contacted': 'bg-amber-50 text-amber-700 border-amber-200',
  'Counseling Scheduled': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Converted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Closed': 'bg-slate-100 text-slate-700 border-slate-200',
  'Lost': 'bg-rose-50 text-rose-700 border-rose-200',
};

export function CounselorEnquiriesView({ onEnquiryConverted }) {
  const [enquiries, setEnquiries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isInteractModalOpen, setIsInteractModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [enquiryDetails, setEnquiryDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // New Enquiry Form
  const [newForm, setNewForm] = useState({
    name: '',
    email: '',
    phone: '',
    course_name: '',
    source: 'Website',
    status: 'New',
    notes: '',
    next_follow_up_date: '',
  });

  // Interaction Form
  const [interactForm, setInteractForm] = useState({
    interaction_type: 'Call',
    summary: '',
    details: '',
  });

  // Convert Form
  const [convertForm, setConvertForm] = useState({
    course_title: '',
    notes: '',
  });

  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getCounselorEnquiries({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        sort_by: sortBy,
        page,
        page_size: pageSize,
      });
      setEnquiries(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      setError(err?.message || 'Failed to load enquiries.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, sourceFilter, sortBy, page, pageSize]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Open Details Modal
  const handleOpenDetails = async (enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsDetailModalOpen(true);
    try {
      const details = await dashboardApi.getEnquiryDetail(enquiry.id);
      setEnquiryDetails(details);
    } catch (err) {
      setError(err?.message || 'Failed to fetch enquiry details.');
    }
  };

  // Open Log Interaction Modal
  const handleOpenInteract = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setInteractForm({ interaction_type: 'Call', summary: '', details: '' });
    setIsInteractModalOpen(true);
  };

  // Open Convert Modal
  const handleOpenConvert = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setConvertForm({
      course_title: enquiry.course_name || 'Full Stack Web Development',
      notes: '',
    });
    setIsConvertModalOpen(true);
  };

  // Submit New Enquiry
  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    if (!newForm.name || !newForm.email) return;
    setIsSubmitting(true);
    try {
      await dashboardApi.createEnquiry({
        ...newForm,
        next_follow_up_date: newForm.next_follow_up_date || undefined,
      });
      setIsNewModalOpen(false);
      setNewForm({
        name: '',
        email: '',
        phone: '',
        course_name: '',
        source: 'Website',
        status: 'New',
        notes: '',
        next_follow_up_date: '',
      });
      setActionSuccess('Enquiry created successfully!');
      setTimeout(() => setActionSuccess(null), 3000);
      fetchEnquiries();
    } catch (err) {
      alert(err?.message || 'Error creating enquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Interaction
  const handleRecordInteraction = async (e) => {
    e.preventDefault();
    if (!interactForm.summary) return;
    setIsSubmitting(true);
    try {
      await dashboardApi.recordEnquiryInteraction(selectedEnquiry.id, interactForm);
      setIsInteractModalOpen(false);
      setActionSuccess('Contact attempt recorded.');
      setTimeout(() => setActionSuccess(null), 3000);
      fetchEnquiries();
      if (isDetailModalOpen) {
        const updated = await dashboardApi.getEnquiryDetail(selectedEnquiry.id);
        setEnquiryDetails(updated);
      }
    } catch (err) {
      alert(err?.message || 'Error recording interaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Conversion
  const handleConvertEnquiry = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dashboardApi.convertEnquiry(selectedEnquiry.id, convertForm);
      setIsConvertModalOpen(false);
      setActionSuccess(`Enquiry successfully converted to active Admission application!`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchEnquiries();
      if (onEnquiryConverted) onEnquiryConverted();
    } catch (err) {
      alert(err?.message || 'Error converting enquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {actionSuccess && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* Control Bar: Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by prospect name, email, phone, or program..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Counseling Scheduled">Counseling Scheduled</option>
            <option value="Converted">Converted</option>
            <option value="Closed">Closed</option>
            <option value="Lost">Lost</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hidden sm:block"
          >
            <option value="">All Sources</option>
            <option value="Website">Website</option>
            <option value="Campus Walk-in">Campus Walk-in</option>
            <option value="Referral">Referral</option>
            <option value="Social Media">Social Media</option>
            <option value="Education Fair">Education Fair</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hidden lg:block"
          >
            <option value="recent">Recently Updated</option>
            <option value="created_at">Date Created</option>
            <option value="next_follow_up">Next Follow-up</option>
          </select>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsNewModalOpen(true)}
          className="shrink-0"
        >
          New Enquiry
        </Button>
      </div>

      {/* Enquiries Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Prospect</th>
                <th className="px-4 py-3">Interested Program</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Next Follow-up</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    <p className="mt-2 text-xs">Loading enquiries...</p>
                  </td>
                </tr>
              ) : enquiries.length > 0 ? (
                enquiries.map((enq) => {
                  const isOverdue =
                    enq.next_follow_up_date &&
                    new Date(enq.next_follow_up_date) < new Date(new Date().setHours(0, 0, 0, 0)) &&
                    enq.status !== 'Converted';

                  return (
                    <tr key={enq.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{enq.name}</div>
                        <div className="flex flex-col gap-0.5 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {enq.email}
                          </span>
                          {enq.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {enq.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        {enq.course_name || 'General Inquiry'}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        <span className="inline-block bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {enq.source}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            STATUS_BADGES[enq.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {enq.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        {enq.next_follow_up_date ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span
                              className={
                                isOverdue ? 'font-bold text-rose-600' : 'font-medium text-slate-700'
                              }
                            >
                              {new Date(enq.next_follow_up_date).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {isOverdue && (
                              <span className="rounded bg-rose-100 px-1 text-[10px] font-bold text-rose-700">
                                Overdue
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleOpenDetails(enq)}
                          >
                            Details
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            icon={Phone}
                            onClick={() => handleOpenInteract(enq)}
                          >
                            Contact
                          </Button>
                          {enq.status !== 'Converted' && (
                            <Button
                              size="xs"
                              variant="primary"
                              icon={FileCheck2}
                              onClick={() => handleOpenConvert(enq)}
                            >
                              Convert
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      title="No enquiries found"
                      description="Create your first enquiry or try clearing applied search filters."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            <span>
              Showing {Math.min((page - 1) * pageSize + 1, total)} -{' '}
              {Math.min(page * pageSize, total)} of {total} enquiries
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="font-semibold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <Button
                size="xs"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Create New Enquiry */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Add Prospective Student Enquiry"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateEnquiry} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={newForm.name}
              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={newForm.email}
                onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                placeholder="student@example.com"
                className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={newForm.phone}
                onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Interested Program
              </label>
              <input
                type="text"
                value={newForm.course_name}
                onChange={(e) => setNewForm({ ...newForm, course_name: e.target.value })}
                placeholder="e.g. Full Stack Web Dev"
                className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Source
              </label>
              <select
                value={newForm.source}
                onChange={(e) => setNewForm({ ...newForm, source: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Website">Website</option>
                <option value="Campus Walk-in">Campus Walk-in</option>
                <option value="Referral">Referral</option>
                <option value="Social Media">Social Media</option>
                <option value="Education Fair">Education Fair</option>
                <option value="Phone">Phone</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Next Follow-up Date
            </label>
            <input
              type="date"
              value={newForm.next_follow_up_date}
              onChange={(e) => setNewForm({ ...newForm, next_follow_up_date: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Counselor Notes
            </label>
            <textarea
              rows={3}
              value={newForm.notes}
              onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
              placeholder="Candidate background, career aspirations, and discussion notes..."
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Save Enquiry'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Enquiry Details & Interaction Timeline */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedEnquiry ? `Enquiry: ${selectedEnquiry.name}` : 'Enquiry Details'}
        maxWidth="max-w-2xl"
      >
        {selectedEnquiry && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Status</span>
                <span className="font-semibold text-slate-800">{selectedEnquiry.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Program</span>
                <span className="font-semibold text-slate-800">{selectedEnquiry.course_name || 'General'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Source</span>
                <span className="font-semibold text-slate-800">{selectedEnquiry.source}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Next Follow-up</span>
                <span className="font-semibold text-slate-800">
                  {selectedEnquiry.next_follow_up_date || 'None'}
                </span>
              </div>
            </div>

            {selectedEnquiry.notes && (
              <div className="text-xs text-slate-700 bg-amber-50/60 border border-amber-100 p-3 rounded-lg">
                <span className="font-bold text-amber-900 block mb-1">Notes:</span>
                {selectedEnquiry.notes}
              </div>
            )}

            {/* Interactions Timeline */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Communication History ({enquiryDetails?.interactions?.length || 0})
                </h4>
                <Button
                  size="xs"
                  variant="outline"
                  icon={Phone}
                  onClick={() => handleOpenInteract(selectedEnquiry)}
                >
                  Log Communication
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {enquiryDetails?.interactions?.length > 0 ? (
                  enquiryDetails.interactions.map((int, i) => (
                    <div key={int.id || i} className="p-3 rounded-lg border border-slate-200/80 bg-white text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                          {int.summary}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(int.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {int.details && <p className="text-slate-600 pl-5">{int.details}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    No communication logs recorded yet.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              {selectedEnquiry.status !== 'Converted' && (
                <Button
                  variant="primary"
                  icon={FileCheck2}
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenConvert(selectedEnquiry);
                  }}
                >
                  Convert to Admission
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Log Interaction */}
      <Modal
        isOpen={isInteractModalOpen}
        onClose={() => setIsInteractModalOpen(false)}
        title={selectedEnquiry ? `Log Communication with ${selectedEnquiry.name}` : 'Log Interaction'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordInteraction} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Communication Channel
            </label>
            <select
              value={interactForm.interaction_type}
              onChange={(e) => setInteractForm({ ...interactForm, interaction_type: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Call">Phone Call</option>
              <option value="Email">Email Communication</option>
              <option value="In-Person Meeting">In-Person Campus Counseling</option>
              <option value="Note">Internal Counselor Note</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Summary *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Discussed fee installment schedule"
              value={interactForm.summary}
              onChange={(e) => setInteractForm({ ...interactForm, summary: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Discussion Details
            </label>
            <textarea
              rows={3}
              placeholder="Enter summary of prospect queries, objections, or commitments..."
              value={interactForm.details}
              onChange={(e) => setInteractForm({ ...interactForm, details: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsInteractModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Log'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Convert to Admission */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Enquiry to Admission Application"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConvertEnquiry} className="p-6 space-y-4">
          <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-lg text-xs text-indigo-900">
            <p className="font-bold">Converting Prospect:</p>
            <p>{selectedEnquiry?.name} ({selectedEnquiry?.email})</p>
            <p className="text-indigo-700 mt-1">
              This will create a formal Admission record in the pipeline and initialize the document verification checklist.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirmed Program
            </label>
            <input
              type="text"
              required
              value={convertForm.course_title}
              onChange={(e) => setConvertForm({ ...convertForm, course_title: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Admission Notes
            </label>
            <textarea
              rows={2}
              placeholder="Special batch requests or concessions discussed with prospect..."
              value={convertForm.notes}
              onChange={(e) => setConvertForm({ ...convertForm, notes: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsConvertModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Converting...' : 'Confirm Conversion'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

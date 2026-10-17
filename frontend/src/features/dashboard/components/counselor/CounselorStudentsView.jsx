import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  FileCheck,
  Clock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { EmptyState } from '../../../../components/common/EmptyState';
import { ErrorMessage } from '../../../../components/common/ErrorMessage';
import { dashboardApi } from '../../dashboardApi';

const STATUS_BADGES = {
  Enrolled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On Hold': 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-teal-50 text-teal-700 border-teal-200',
  Dropped: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function CounselorStudentsView() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getCounselorStudents({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        page,
        page_size: pageSize,
      });
      setStudents(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      setError(err?.message || 'Failed to load assigned students.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenDetail = async (student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    try {
      const res = await dashboardApi.getCounselorStudentDetail(student.id);
      setDetailData(res);
    } catch (err) {
      setError(err?.message || 'Failed to fetch student details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <ErrorMessage message={error} />}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search assigned students by name, email, or phone..."
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
            <option value="Enrolled">Enrolled</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500 self-center">
          {total} Assigned {total === 1 ? 'Student' : 'Students'}
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Enrolled Programme</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Admission Stage</th>
                <th className="px-4 py-3">Enrolled Since</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    <p className="mt-2 text-xs">Loading students...</p>
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{st.name}</div>
                      <div className="flex flex-col gap-0.5 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {st.email}
                        </span>
                        {st.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {st.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-medium text-slate-700">
                      {st.enrolled_courses && st.enrolled_courses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {st.enrolled_courses.map((c, i) => (
                            <span
                              key={i}
                              className="inline-block bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-xs text-indigo-700 font-medium"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">No active batches</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          STATUS_BADGES[st.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {st.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">
                      {st.admission_stage || 'Enrolled'}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {new Date(st.created_at).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleOpenDetail(st)}
                      >
                        Profile & History
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      title="No assigned students"
                      description="Students enrolled under your counseling guidance will appear here."
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
              {Math.min(page * pageSize, total)} of {total} students
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

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedStudent ? `Student: ${selectedStudent.name}` : 'Student Record'}
        maxWidth="max-w-2xl"
      >
        <div className="p-6 space-y-6">
          {isDetailLoading ? (
            <div className="py-10 text-center text-slate-400 animate-pulse text-sm">
              Loading student dossier...
            </div>
          ) : detailData ? (
            <>
              {/* Profile Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Status</span>
                  <span className="font-semibold text-slate-800">{detailData.student?.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Email</span>
                  <span className="font-semibold text-slate-800">{detailData.student?.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Phone</span>
                  <span className="font-semibold text-slate-800">{detailData.student?.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Assigned Counselor</span>
                  <span className="font-semibold text-slate-800">{detailData.student?.assigned_counselor_email || '—'}</span>
                </div>
              </div>

              {detailData.student?.notes && (
                <div className="text-xs text-slate-700 bg-amber-50/60 border border-amber-100 p-3 rounded-lg">
                  <span className="font-bold text-amber-900 block mb-1">Counselor Notes:</span>
                  {detailData.student.notes}
                </div>
              )}

              {/* Enrolled Batches */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Enrolled Batches ({detailData.enrollments?.length || 0})
                </h4>
                <div className="space-y-2">
                  {detailData.enrollments?.length > 0 ? (
                    detailData.enrollments.map((enr, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white text-xs">
                        <div>
                          <p className="font-semibold text-slate-900">{enr.course_title}</p>
                          <p className="text-slate-500 text-[11px]">Batch: {enr.batch_code}</p>
                        </div>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          {enr.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No batch enrollments recorded.</p>
                  )}
                </div>
              </div>

              {/* Linked Admissions */}
              {detailData.admissions?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Admission History
                  </h4>
                  <div className="space-y-2">
                    {detailData.admissions.map((adm) => (
                      <div key={adm.id} className="p-3 rounded-lg border border-slate-200 bg-white text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-900">{adm.course_title}</span>
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {adm.stage}
                          </span>
                        </div>
                        {adm.pending_requirements && (
                          <p className="text-slate-600 text-[11px] mt-1">{adm.pending_requirements}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400">No dossier information available.</p>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

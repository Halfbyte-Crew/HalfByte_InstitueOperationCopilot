import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { EmptyState } from '../../../components/common/EmptyState';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Edit2,
  Power,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { useApi, useMutation } from '../../../hooks';
import { staffApi } from '../staffApi';
import { useAuth } from '../../../app/providers';

const ROLE_BADGE = {
  admin: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  counselor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  coordinator: 'bg-sky-100 text-sky-800 border-sky-200',
  trainer: 'bg-teal-100 text-teal-800 border-teal-200',
  finance: 'bg-amber-100 text-amber-800 border-amber-200',
};

const EMPTY_STAFF = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'counselor',
  department: 'Admissions & Counseling',
};

export function StaffManagementPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState(EMPTY_STAFF);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionFeedback, setActionFeedback] = useState({ text: '', type: '' });

  const fetchStaff = useCallback(() => {
    const params = {};
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    if (statusFilter !== '') params.is_active = statusFilter === 'active';
    return staffApi.getStaff(params);
  }, [search, roleFilter, statusFilter]);

  const { data: staffListRaw, isLoading, error, execute: refresh } = useApi(
    fetchStaff,
    [search, roleFilter, statusFilter],
    { initialData: [] }
  );
  const staffList = Array.isArray(staffListRaw) ? staffListRaw : [];

  const { mutate: createStaff, isLoading: isCreating } = useMutation(staffApi.createStaff);
  const { mutate: updateStaff, isLoading: isUpdating } = useMutation((payload) =>
    staffApi.updateStaff(payload.id, payload.data)
  );
  const { mutate: resetStaffPassword, isLoading: isResetting } = useMutation((payload) =>
    staffApi.resetStaffPassword(payload.id, payload.password)
  );
  const { mutate: toggleStatus } = useMutation(staffApi.toggleStaffStatus);

  const handleOpenCreate = () => {
    setFormData(EMPTY_STAFF);
    setShowPassword(false);
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      password: '',
      phone: staff.phone || '',
      role: staff.role,
      department: staff.department || '',
    });
    setShowPassword(false);
    setFormError('');
    setIsEditOpen(true);
  };

  const handleOpenResetPassword = (staff) => {
    setSelectedStaff(staff);
    setResetPasswordValue('');
    setShowPassword(false);
    setFormError('');
    setIsPasswordResetOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = { ...formData };
      if (!payload.password || payload.password.trim().length < 6) {
        setFormError('Please enter a login password of at least 6 characters.');
        return;
      }
      await createStaff(payload);
      setActionFeedback({
        text: `Staff credentials for '${formData.name}' created successfully (${formData.role.toUpperCase()}).`,
        type: 'success',
      });
      setIsCreateOpen(false);
      refresh();
    } catch (err) {
      setFormError(err.message || 'Failed to create staff account.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
      };
      if (formData.password && formData.password.trim().length >= 6) {
        updateData.password = formData.password.trim();
      }
      await updateStaff({
        id: selectedStaff.id,
        data: updateData,
      });
      setActionFeedback({ text: `Staff details for '${formData.name}' updated.`, type: 'success' });
      setIsEditOpen(false);
      refresh();
    } catch (err) {
      setFormError(err.message || 'Failed to update staff record.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    try {
      await resetStaffPassword({
        id: selectedStaff.id,
        password: resetPasswordValue,
      });
      setActionFeedback({
        text: `Login credentials reset for '${selectedStaff.name}'.`,
        type: 'success',
      });
      setIsPasswordResetOpen(false);
      refresh();
    } catch (err) {
      setFormError(err.message || 'Failed to reset password.');
    }
  };

  const handleToggleStatus = async (staff) => {
    const actionWord = staff.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionWord} account for '${staff.name}'?`)) {
      return;
    }

    try {
      await toggleStatus(staff.id);
      setActionFeedback({
        text: `Account for '${staff.name}' is now ${staff.is_active ? 'Inactive' : 'Active'}.`,
        type: 'success',
      });
      refresh();
    } catch (err) {
      setActionFeedback({ text: err.message || 'Failed to change status.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Faculty Management"
        description="ADMIN-only directory: create login credentials, assign operational roles, and manage institutional access."
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={refresh}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={UserPlus} onClick={handleOpenCreate}>
              Add Staff Member
            </Button>
          </div>
        }
      />

      {/* Security boundary notice */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 shadow-xs">
        <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>
          <strong>Credential Control:</strong> Admin creates and resets credentials for Counselor, Trainer, and Finance staff. Admin credentials are authenticated via environment configuration.
        </span>
      </div>

      {actionFeedback.text && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
            actionFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{actionFeedback.text}</span>
          <button
            type="button"
            onClick={() => setActionFeedback({ text: '', type: '' })}
            className="text-slate-400 hover:text-slate-600 text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* Directory Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name or institutional email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="counselor">Counselor</option>
              <option value="coordinator">Coordinator</option>
              <option value="trainer">Trainer / Faculty</option>
              <option value="finance">Finance / Accounts</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
            Loading staff directory...
          </div>
        ) : staffList.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff members found"
            description="No directory records match your selected filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Institutional Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Credentials</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((item) => {
                  const isCurrentAdmin =
                    user?.email?.toLowerCase() === item.email.toLowerCase() ||
                    user?.id?.toLowerCase() === item.email.toLowerCase();

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center border border-slate-200">
                            {item.name ? item.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {item.name}
                              {isCurrentAdmin && (
                                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            ROLE_BADGE[item.role] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {item.department || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {item.has_password ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <KeyRound className="h-3 w-3 text-emerald-600" />
                            Login Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <KeyRound className="h-3 w-3 text-amber-600" />
                            No Password
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenResetPassword(item)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Reset Login Password"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit Permissions & Details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`p-1.5 rounded transition-colors ${
                              item.is_active
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={item.is_active ? 'Deactivate Account' : 'Activate Account'}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          title="Onboard Staff & Create Login Credentials"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
            {formError && <ErrorMessage message={formError} />}

            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                placeholder="e.g. Dr. Ramesh Gupta"
                className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Institutional Email (Login ID) *</label>
              <input
                type="email"
                placeholder="staff@edupilot.io"
                className="w-full rounded-lg border border-slate-300 p-2 bg-white font-mono"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Initial Login Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters (e.g. staff123)"
                  className="w-full rounded-lg border border-slate-300 p-2 pr-9 bg-white"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                The staff member will use this password to sign into their Counselor, Trainer, or Accounts dashboard.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Assigned Role *</label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="counselor">Counselor (Admissions)</option>
                  <option value="trainer">Trainer / Faculty</option>
                  <option value="finance">Finance / Accounts</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Department / Division</label>
              <input
                type="text"
                placeholder="e.g. Computer Science Faculty"
                className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={isCreating}>
                Create Staff Account
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Staff Modal */}
      {isEditOpen && selectedStaff && (
        <Modal
          isOpen={true}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Staff Details — ${selectedStaff.name}`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
            {formError && <ErrorMessage message={formError} />}

            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Email (Read Only)</label>
              <input
                type="email"
                disabled
                className="w-full rounded-lg border border-slate-200 p-2 bg-slate-50 text-slate-500 font-mono"
                value={formData.email}
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Reset Password (Optional)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Leave blank to keep current password"
                  className="w-full rounded-lg border border-slate-300 p-2 pr-9 bg-white"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Assigned Role *</label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="counselor">Counselor</option>
                  <option value="trainer">Trainer / Faculty</option>
                  <option value="finance">Finance / Accounts</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Department</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={isUpdating}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Quick Reset Password Modal */}
      {isPasswordResetOpen && selectedStaff && (
        <Modal
          isOpen={true}
          onClose={() => setIsPasswordResetOpen(false)}
          title={`Reset Credentials — ${selectedStaff.name}`}
        >
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
            {formError && <ErrorMessage message={formError} />}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-slate-700 font-semibold">{selectedStaff.name}</p>
              <p className="text-slate-500 font-mono text-[11px] mt-0.5">{selectedStaff.email}</p>
              <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                ROLE_BADGE[selectedStaff.role] || 'bg-slate-100 text-slate-700'
              }`}>
                {selectedStaff.role}
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">New Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-lg border border-slate-300 p-2 pr-9 bg-white text-slate-900"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPasswordResetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={isResetting} icon={KeyRound}>
                Update Password
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

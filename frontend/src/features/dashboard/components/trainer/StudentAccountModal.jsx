import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  KeyRound,
  Copy,
  Check,
  AlertCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import {
  getStudentAccountStatus,
  createStudentAccount,
  regenerateStudentActivation,
} from '../../dashboardApi';

export function StudentAccountModal({ isOpen, onClose, student, onAccountCreated }) {
  const [accountData, setAccountData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [newActivationData, setNewActivationData] = useState(null);

  useEffect(() => {
    if (isOpen && student?.id) {
      loadStatus();
    } else {
      setAccountData(null);
      setNewActivationData(null);
      setError(null);
      setCopied(false);
    }
  }, [isOpen, student]);

  const loadStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStudentAccountStatus(student.id);
      setAccountData(data);
    } catch (err) {
      console.error('Failed to load student account status:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load account status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrRegenerate = async (isRegen = false) => {
    setIsSubmitting(true);
    setError(null);
    setCopied(false);
    try {
      const res = isRegen
        ? await regenerateStudentActivation(student.id)
        : await createStudentAccount(student.id);

      setNewActivationData(res);
      await loadStatus();
      if (onAccountCreated) onAccountCreated();
    } catch (err) {
      console.error('Account action failed:', err);
      setError(err?.response?.data?.detail || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!newActivationData?.activation_url) return;
    const fullUrl = `${window.location.origin}${newActivationData.activation_url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!isOpen) return null;

  const currentStatus = accountData?.account_status || 'not_created';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Student Account Provisioning</h3>
              <p className="text-xs text-slate-500">Manage login credentials and activation access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Student Profile Info */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{student?.name}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{student?.email}</p>
                {student?.phone && (
                  <p className="text-2xs text-slate-400 mt-1">Phone: {student.phone}</p>
                )}
              </div>
              <div>
                {currentStatus === 'active' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Active Account
                  </span>
                )}
                {currentStatus === 'pending_activation' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Activation
                  </span>
                )}
                {currentStatus === 'not_created' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Not Created
                  </span>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Activation Link Box */}
          {newActivationData?.activation_url && (
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Single-Use Activation Link Generated
                </span>
                <span className="text-2xs text-emerald-600 font-normal">Valid for 48 Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${newActivationData.activation_url}`}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-emerald-300 rounded-lg text-slate-800 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-2xs text-emerald-700 leading-relaxed">
                Provide this link privately to the student. When clicked, they will choose their
                secure personal password and activate their student account.
              </p>
            </div>
          )}

          {/* Guidelines & Role Security Notice */}
          <div className="space-y-2 text-xs text-slate-600 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60">
            <h5 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              Account Security Rules
            </h5>
            <ul className="list-disc pl-4 space-y-1 text-2xs text-slate-500">
              <li>
                This workflow provisions login access with role <strong>Student</strong> only.
              </li>
              <li>
                Trainers cannot view or change student passwords, nor set administrative roles.
              </li>
              <li>
                Activation tokens are cryptographically single-use and expire after 48 hours.
              </li>
              <li>
                Financial records and payment details are never accessible to trainers or included in
                student account responses.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {currentStatus === 'not_created' && (
              <button
                type="button"
                disabled={isSubmitting || isLoading}
                onClick={() => handleCreateOrRegenerate(false)}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Student Account'}
              </button>
            )}

            {currentStatus === 'pending_activation' && (
              <button
                type="button"
                disabled={isSubmitting || isLoading}
                onClick={() => handleCreateOrRegenerate(true)}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isSubmitting ? 'Regenerating...' : 'Regenerate Activation Link'}
              </button>
            )}

            {currentStatus === 'active' && (
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Ready for student sign-in
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

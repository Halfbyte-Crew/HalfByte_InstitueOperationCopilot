import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../../app/providers';
import { verifyActivationToken, activateStudentAccount } from '../../dashboard/dashboardApi';

/**
 * Student Account Activation Page.
 *
 * Public entrypoint for newly provisioned students arriving via an invitation link:
 *   /activate?token=<activation_token>
 *
 * Workflow Lifecycle:
 * 1. Token Validation: On component mount, the single-use token is validated with the backend.
 *    If expired (>48 hours) or already consumed, an informative error state is displayed.
 * 2. Password Configuration: Prompts the student to set a secure password (minimum 8 characters).
 * 3. Atomic Activation: Submits credentials to `/api/v1/auth/activate-student`.
 *    Backend hashes with bcrypt, transitions account status to 'active', and invalidates token.
 * 4. Auto-Login: Seamlessly establishes a JWT student session and redirects to `/dashboard/student`.
 */
export function StudentActivationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Extract raw activation token from URL query string
  const tokenParam = searchParams.get('token') || '';

  // ── State Management ──────────────────────────────────────────────────────
  const [tokenInfo, setTokenInfo] = useState(null);
  const [verifying, setVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isActivated, setIsActivated] = useState(false);

  // ── 1. Token Verification on Mount ────────────────────────────────────────
  useEffect(() => {
    if (!tokenParam) {
      setVerifying(false);
      setVerifyError('No activation token provided. Please check the activation link provided by your trainer.');
      return;
    }

    let isMounted = true;
    setVerifying(true);
    setVerifyError(null);

    verifyActivationToken(tokenParam)
      .then((data) => {
        if (isMounted) {
          setTokenInfo(data);
          setVerifying(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setVerifying(false);
          setVerifyError(
            err?.response?.data?.detail ||
              'This activation token is invalid, expired, or has already been used. Please request a new activation link from your trainer.'
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tokenParam]);

  // ── 2. Password Submission & Account Activation ───────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validations
    if (!password) {
      setFormError('Please enter a password.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      // Send token and chosen password to activate account
      const result = await activateStudentAccount({
        token: tokenParam,
        password: password,
      });

      setIsActivated(true);

      // Auto login with the received student JWT token and navigate to student portal
      if (result.access_token) {
        setTimeout(() => {
          login(result.access_token, {
            email: result.email,
            name: result.name,
            role: 'student',
            student_id: result.student_id,
          });
          navigate('/dashboard/student');
        }, 1500);
      }
    } catch (err) {
      setFormError(
        err?.response?.data?.detail ||
          'Failed to activate account. The link may have expired or been used already.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render Views ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 mb-4 ring-4 ring-indigo-500/20">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">EduPilot Student Portal</h2>
        <p className="mt-2 text-sm text-indigo-200">
          Activate your student learning account and set your credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {verifying ? (
            /* Loading State while validating token with backend */
            <div className="text-center py-10 space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-600">Verifying your invitation link...</p>
            </div>
          ) : verifyError ? (
            /* Invalid or Expired Token State */
            <div className="space-y-6">
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-center">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-rose-900">Activation Link Invalid</h3>
                <p className="text-xs text-rose-700 mt-2 leading-relaxed">{verifyError}</p>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Return to Student Sign In <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : isActivated ? (
            /* Activation Success & Redirect State */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Account Activated Successfully!</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Welcome aboard, <span className="font-semibold text-slate-700">{tokenInfo?.student_name}</span>.
                </p>
                <p className="text-xs text-indigo-600 mt-3 font-medium flex items-center justify-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirecting to your student dashboard...
                </p>
              </div>
            </div>
          ) : (
            /* Active Form State: Password Setup */
            <div>
              {/* Student Greeting Card */}
              <div className="mb-6 p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {tokenInfo?.student_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{tokenInfo?.student_name}</h4>
                    <p className="text-xs text-slate-500 font-mono">{tokenInfo?.email}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-indigo-100/80 flex items-center justify-between text-xs text-indigo-700">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Role: <strong className="capitalize">{tokenInfo?.role || 'Student'}</strong>
                  </span>
                  <span className="text-[11px] text-slate-500">Exp: {tokenInfo?.expires_at ? new Date(tokenInfo.expires_at).toLocaleDateString() : '48 Hours'}</span>
                </div>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    minLength={8}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                  />
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-slate-400" /> Password will be encrypted with industry-standard bcrypt.
                  </p>
                  <p className="text-slate-400">
                    This activation token will become invalid immediately upon submission.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Activating Account...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" /> Complete Activation & Sign In
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center border-t border-slate-100 pt-4">
                <Link to="/login" className="text-xs text-slate-500 hover:text-slate-700">
                  Already have an active password? <span className="text-indigo-600 font-semibold">Sign In</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Privacy Policy & Terms Links */}
        <div className="mt-6 text-center space-y-1">
          <div className="flex items-center justify-center gap-4 text-xs text-indigo-200/80">
            <Link
              to="/privacy"
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link
              to="/terms"
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Terms &amp; Conditions
            </Link>
          </div>
          <div className="text-[11px] text-slate-400">
            EduPilot Institute Operations Platform &copy; 2026
          </div>
        </div>
      </div>
    </div>
  );
}

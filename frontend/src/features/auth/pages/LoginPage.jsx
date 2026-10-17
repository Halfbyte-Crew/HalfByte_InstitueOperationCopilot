import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../app/providers';
import { authApi } from '../authApi';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { GraduationCap, ShieldCheck, Lock } from 'lucide-react';
import { getDashboardPath } from '../../../utils/rbac';

export function LoginPage() {
  // Pre-fill with root administrator credentials
  const [email, setEmail] = useState('admin@edupilot.io');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, dashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If the user is already logged in, redirect them to their designated dashboard.
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname ?? dashboardPath;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, dashboardPath, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Authenticate with backend — returns signed JWT and user profile
      const response = await authApi.login(email, password);
      const { access_token, user } = response;

      // Store token and profile in auth provider
      login(access_token, user);

      // Redirect to the role-specific dashboard (Admin, Counselor, Trainer, Accounts, or Student)
      const destination =
        location.state?.from?.pathname ?? getDashboardPath(user.role);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 relative overflow-hidden">
      {/* Background visual accents — refined Indigo and Sky glow, no purple */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-4 relative z-10">
        {/* Main login card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 mb-4 ring-4 ring-indigo-500/10">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">EduPilot Operations Hub</h1>
            <p className="mt-1.5 text-xs text-slate-500">
              Sign in to manage institute operations, admissions &amp; AI copilot
            </p>
          </div>

          {error && <ErrorMessage message={error} className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="login-email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="e.g. admin@edupilot.io"
            />

            <Input
              id="login-password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />

            <Button
              id="login-submit"
              type="submit"
              className="w-full py-2.5 font-semibold mt-2"
              isLoading={isLoading}
            >
              Sign In to Dashboard
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Role-Based Access Control Active</span>
          </div>
        </div>

        {/* Footer with Privacy Policy & Terms Links */}
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <Link
              to="/privacy"
              className="hover:text-indigo-300 transition-colors underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link
              to="/terms"
              className="hover:text-indigo-300 transition-colors underline-offset-4 hover:underline"
            >
              Terms &amp; Conditions
            </Link>
          </div>
          <div className="text-[11px] text-slate-500">
            EduPilot Institute Operations Platform &copy; 2026
          </div>
        </div>
      </div>
    </div>
  );
}

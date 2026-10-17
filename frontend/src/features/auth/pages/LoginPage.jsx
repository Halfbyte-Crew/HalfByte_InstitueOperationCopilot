import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/providers';
import { authApi } from '../authApi';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { getDashboardPath } from '../../../utils/rbac';

/** Demo credential hints shown on the login page to make it easy to test roles. */
const DEMO_ACCOUNTS = [
  { label: 'Owner / Admin', email: 'owner@edupilot.io', role: 'super_admin' },
  { label: 'Counselor', email: 'counselor@edupilot.io', role: 'counselor' },
  { label: 'Trainer', email: 'trainer@edupilot.io', role: 'trainer' },
  { label: 'Accounts', email: 'accounts@edupilot.io', role: 'finance' },
  { label: 'Student', email: 'student@edupilot.io', role: 'student' },
];

export function LoginPage() {
  const [email, setEmail] = useState('owner@edupilot.io');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, dashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If the user is already logged in, redirect them to their dashboard.
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
      // Call the real backend — role comes from the JWT, not the browser.
      const response = await authApi.login(email, password);
      const { access_token, user } = response;

      // Persist token and user profile returned by the backend.
      login(access_token, user);

      // Redirect to the role's designated dashboard (or the page the user tried to visit).
      const destination =
        location.state?.from?.pathname ?? getDashboardPath(user.role);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-4">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">EduPilot Portal</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to manage institute operations &amp; AI copilot
            </p>
          </div>

          {error && <ErrorMessage message={error} className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="login-email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              id="login-password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button
              id="login-submit"
              type="submit"
              className="w-full py-2.5 font-semibold"
              isLoading={isLoading}
            >
              Sign In to Dashboard
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Role-Based Access Control Active</span>
          </div>
        </div>

        {/* Demo credentials card */}
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">
            🔑 Demo Credentials (Phase 3 Scaffolding)
          </p>
          <div className="space-y-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleDemoClick(acc.email)}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
              >
                <span className="text-xs font-medium text-slate-700">{acc.label}</span>
                <span className="text-[11px] text-slate-400 group-hover:text-indigo-600 font-mono">
                  {acc.email}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Password for all demo accounts: <code className="font-mono bg-slate-100 px-1 rounded">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}

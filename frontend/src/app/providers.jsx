import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../features/auth/authApi';
import { getDashboardPath } from '../utils/rbac';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user_profile');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  // isLoading is true while we are re-validating the token on mount.
  // This prevents a flash redirect to /login before the session is confirmed.
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('access_token'));

  // Re-validate token with backend on mount (handles page refresh).
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    authApi
      .getCurrentUser()
      .then((freshUser) => {
        // Persist the fresh user profile so the role is always from the backend.
        localStorage.setItem('user_profile', JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        // Token is invalid or expired — clear everything.
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_profile');
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Listen for 401 events dispatched by apiClient.
  useEffect(() => {
    const handleSessionExpired = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  const login = useCallback((newToken, userProfile) => {
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('user_profile', JSON.stringify(userProfile));
    setToken(newToken);
    setUser(userProfile);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort — clear local state regardless.
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_profile');
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    /** Convenience: the dashboard path for the currently logged-in user's role. */
    dashboardPath: user ? getDashboardPath(user.role) : '/login',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

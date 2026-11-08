'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { SafeUser } from '@/models/User';
import { authApi } from '@/lib/api/auth';
import { ApiClientError } from '@/lib/api/types';
import { LoginInput, RegisterInput } from '@/validations/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: SafeUser | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginInput) => Promise<SafeUser>;
  register: (data: RegisterInput) => Promise<SafeUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<SafeUser | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  /**
   * Session restoration on mount:
   * Relies exclusively on the HTTP-only echoes_token cookie transmitted to /api/auth/me.
   * Zero localStorage or sessionStorage storage is used.
   */
  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      try {
        const currentUser = await authApi.getMe();
        if (isMounted) {
          setUser(currentUser);
          setStatus('authenticated');
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setUser(null);
          setStatus('unauthenticated');
          if (err instanceof ApiClientError && !err.isUnauthenticated) {
            console.warn('[Echoes Auth] Initial session check encountered:', err.message);
          }
        }
      }
    }

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Login handler
   */
  const login = useCallback(async (credentials: LoginInput): Promise<SafeUser> => {
    try {
      setError(null);
      const { user: authenticatedUser } = await authApi.login(credentials);
      setUser(authenticatedUser);
      setStatus('authenticated');
      return authenticatedUser;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please verify credentials.';
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Registration handler
   */
  const register = useCallback(async (data: RegisterInput): Promise<SafeUser> => {
    try {
      setError(null);
      const { user: newUser } = await authApi.register(data);
      setUser(newUser);
      setStatus('authenticated');
      return newUser;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Logout handler
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('[Echoes Auth] Remote logout error, clearing local state anyway:', err);
    } finally {
      setUser(null);
      setStatus('unauthenticated');
      setError(null);
    }
  }, []);

  /**
   * Explicit session refresh
   */
  const refresh = useCallback(async (): Promise<SafeUser | null> => {
    try {
      setStatus('loading');
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      setStatus('authenticated');
      setError(null);
      return currentUser;
    } catch {
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated' && user !== null,
      error,
      login,
      register,
      logout,
      refresh,
      clearError,
    }),
    [user, status, error, login, register, logout, refresh, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}

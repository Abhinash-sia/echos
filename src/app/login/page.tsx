'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { authApi } from '@/lib/api/auth';
import { ApiClientError } from '@/lib/api/types';
import { EditorialHeader } from '@/components/layout/EditorialHeader';
import { Container } from '@/components/layout/Container';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FloatingSticker } from '@/components/ui/FloatingSticker';
import {
  ArrowRightIcon,
  AlertCircleIcon,
  CheckIcon,
  KeyIcon,
  MailIcon,
} from '@/components/icons/Icons';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';
  const toast = useToast();

  const { login, isAuthenticated } = useAuth();

  // Mode: 'login' or 'recover'
  const [mode, setMode] = useState<'login' | 'recover'>('login');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recovery State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Detect #recover in URL hash
  useEffect(() => {
    const checkHash = () => {
      if (typeof window !== 'undefined' && window.location.hash === '#recover') {
        setMode('recover');
      } else if (typeof window !== 'undefined' && !window.location.hash) {
        setMode('login');
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Switch to login mode
  const switchToLogin = () => {
    setMode('login');
    setErrorMessage(null);
    setRecoveryError(null);
    setRecoverySuccess(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  // Switch to recover mode
  const switchToRecover = () => {
    setMode('recover');
    setErrorMessage(null);
    setRecoveryError(null);
    setRecoverySuccess(null);
    if (typeof window !== 'undefined') {
      window.location.hash = 'recover';
    }
  };

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      router.push(from);
    }
  }, [isAuthenticated, router, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login({ email: email.trim(), password });
      toast.success('Welcome Back', 'Authentication successful. Entering your vault.');
      router.push(from);
    } catch (err: unknown) {
      let errorText = 'An unexpected error occurred during sign in.';
      if (err instanceof ApiClientError) {
        if (err.isRateLimited) {
          errorText = 'Too many failed login attempts. Please wait before trying again.';
          toast.error('Rate Limited', errorText);
        } else {
          errorText = err.message || 'Invalid email or password.';
          toast.error('Sign In Failed', errorText);
        }
      } else if (err instanceof Error) {
        errorText = err.message;
        toast.error('Sign In Failed', errorText);
      } else {
        toast.error('Error', errorText);
      }
      setErrorMessage(errorText);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccess(null);

    if (!recoveryEmail.trim()) {
      setRecoveryError('Please provide your registered email address.');
      return;
    }

    try {
      setRecoveryLoading(true);
      const message = await authApi.forgotPassword({ email: recoveryEmail.trim() });
      setRecoverySuccess(
        message ||
          'If an account with that email address exists, a password reset link has been dispatched to your inbox.'
      );
      toast.info('Recovery Dispatched', 'Password reset instructions sent if email exists.');
    } catch (err: unknown) {
      let errorText = 'Unable to dispatch recovery link. Please try again later.';
      if (err instanceof ApiClientError) {
        if (err.isRateLimited) {
          errorText = 'Too many recovery attempts. Please try again in a few minutes.';
        } else {
          errorText = err.message || errorText;
        }
      } else if (err instanceof Error) {
        errorText = err.message;
      }
      setRecoveryError(errorText);
      toast.error('Recovery Failed', errorText);
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Playful Surrealism Card */}
      <div className="relative bg-white dark:bg-[#1E2035] border-2 border-[#191A2B] dark:border-white/20 p-8 sm:p-10 rounded-sm shadow-2xl">
        {/* Floating decorative stamp */}
        <div className="absolute -top-5 -right-4 z-10 pointer-events-none hidden sm:block">
          <FloatingSticker color={mode === 'recover' ? 'yellow' : 'coral'} rotate={8}>
            {mode === 'recover' ? 'RECOVER' : 'AUTHENTIC'}
          </FloatingSticker>
        </div>

        {mode === 'recover' ? (
          /* =========================================================================
             PASSWORD RECOVERY VIEW (/login#recover)
             ========================================================================= */
          <div>
            {/* Card Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="coral">PASSWORD RECOVERY</Badge>
                <span className="font-mono text-[10px] text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider">
                  EMERGENCY RESET
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#191A2B] dark:text-[#F7F3EC] tracking-tight">
                Recover Vault Access
              </h1>
              <p className="font-sans text-sm text-[#767C9D] dark:text-[#A4AAC7] mt-2">
                Enter your registered email address and we&apos;ll dispatch a secure recovery link
                to restore access.
              </p>
            </div>

            {/* Structured Error Banner */}
            {recoveryError && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-sm bg-[#FF684D]/10 border border-[#FF684D]/40 text-[#191A2B] dark:text-[#F7F3EC] flex items-start gap-3"
              >
                <span className="text-[#FF684D] mt-0.5 shrink-0">
                  <AlertCircleIcon size={18} />
                </span>
                <div className="text-xs font-sans leading-relaxed">
                  <strong className="font-semibold block text-[#FF684D]">Recovery Error</strong>
                  <span>{recoveryError}</span>
                </div>
              </div>
            )}

            {/* Recovery Success Banner */}
            {recoverySuccess ? (
              <div className="space-y-6">
                <div
                  role="status"
                  className="p-5 rounded-sm bg-[#39BFAE]/10 border border-[#39BFAE]/40 text-[#191A2B] dark:text-[#F7F3EC] flex items-start gap-3"
                >
                  <span className="text-[#39BFAE] mt-0.5 shrink-0">
                    <CheckIcon size={18} />
                  </span>
                  <div className="text-xs font-sans leading-relaxed">
                    <strong className="font-semibold block text-[#39BFAE] mb-1">
                      Instructions Dispatched
                    </strong>
                    <span>{recoverySuccess}</span>
                    <p className="text-[11px] text-[#767C9D] dark:text-[#A4AAC7] mt-2">
                      Please check your inbox (and spam folder) for the verification link.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="coral"
                    size="md"
                    className="w-full justify-center"
                    onClick={switchToLogin}
                  >
                    Return to Sign In
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoverySuccess(null);
                    }}
                    className="w-full text-center font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7] hover:text-[#FF684D] transition-colors py-2"
                  >
                    Send another link with a different email
                  </button>
                </div>
              </div>
            ) : (
              /* Recovery Form */
              <form onSubmit={handleRecoverySubmit} className="space-y-5">
                <Input
                  id="recover-email"
                  type="email"
                  label="Registered Email Address"
                  placeholder="archivist@vault.org"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={recoveryLoading}
                  icon={<MailIcon size={16} />}
                />

                <Button
                  type="submit"
                  variant="coral"
                  size="lg"
                  loading={recoveryLoading}
                  disabled={recoveryLoading}
                  icon={<KeyIcon size={16} />}
                  iconPosition="left"
                  className="w-full justify-center mt-2"
                >
                  {recoveryLoading ? 'Dispatching Link...' : 'Dispatch Recovery Instructions'}
                </Button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="font-mono text-xs text-[#767C9D] dark:text-[#A4AAC7] hover:text-[#FF684D] transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:underline"
                  >
                    ← Return to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* =========================================================================
             STANDARD SIGN IN VIEW (/login)
             ========================================================================= */
          <div>
            {/* Card Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="cobalt">SESSION AUTH</Badge>

                <span className="font-mono text-[10px] text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider">
                  INVIOLABLE ACCESS
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#191A2B] dark:text-[#F7F3EC] tracking-tight">
                Enter the Vault
              </h1>
              <p className="font-sans text-sm text-[#767C9D] dark:text-[#A4AAC7] mt-2">
                Sign in to access your personal journal, photographs, and sealed time capsules.
              </p>
            </div>

            {/* Structured Error Alert Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-sm bg-[#FF684D]/10 border border-[#FF684D]/40 text-[#191A2B] dark:text-[#F7F3EC] flex items-start gap-3"
              >
                <span className="text-[#FF684D] mt-0.5 shrink-0">
                  <AlertCircleIcon size={18} />
                </span>
                <div className="text-xs font-sans leading-relaxed">
                  <strong className="font-semibold block text-[#FF684D]">
                    Authentication Error
                  </strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="login-email"
                type="email"
                label="Email Address"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block font-mono text-xs uppercase tracking-wider text-[#767C9D] dark:text-[#A4AAC7] font-medium"
                  >
                    Password
                  </label>
                  <a
                    href="#recover"
                    onClick={(e) => {
                      e.preventDefault();
                      switchToRecover();
                    }}
                    className="text-xs font-mono text-[#767C9D] dark:text-[#A4AAC7] hover:text-[#FF684D] transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                variant="coral"
                size="lg"
                loading={loading}
                disabled={loading}
                icon={<ArrowRightIcon size={16} />}
                iconPosition="right"
                className="w-full justify-center mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Vault'}
              </Button>
            </form>

            {/* Footer Navigation */}
            <div className="mt-8 pt-6 border-t border-[#191A2B]/10 dark:border-white/10 text-center">
              <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7]">
                Don&apos;t have an account yet?{' '}
                <Link
                  href="/register"
                  className="text-[#FF684D] font-semibold hover:underline underline-offset-2 ml-1"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F3EC] dark:bg-[#191A2B] text-[#191A2B] dark:text-[#F7F3EC]">
      <EditorialHeader />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Container size="narrow">
          <Suspense
            fallback={
              <div className="max-w-md mx-auto p-12 bg-white dark:bg-[#1E2035] rounded-sm text-center animate-pulse">
                <span className="font-mono text-xs text-[#767C9D]">Loading session portal...</span>
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </Container>
      </main>
    </div>
  );
}

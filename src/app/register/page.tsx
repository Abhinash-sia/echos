'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiClientError } from '@/lib/api/types';
import { EditorialHeader } from '@/components/layout/EditorialHeader';
import { Container } from '@/components/layout/Container';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FloatingSticker } from '@/components/ui/FloatingSticker';
import { ArrowRightIcon, AlertCircleIcon, CheckIcon, CloseIcon } from '@/components/icons/Icons';

function RegisterForm() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Real-time password requirement validations
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const passwordRequirements = [
    { label: '8+ Characters', met: hasMinLength },
    { label: 'Uppercase Letter', met: hasUpper },
    { label: 'Lowercase Letter', met: hasLower },
    { label: 'At least one number', met: hasNumber },
  ];

  const isFormValid =
    name.trim().length >= 2 &&
    email.includes('@') &&
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasNumber &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!isFormValid) {
      setErrorMessage('Please ensure all password requirements and fields are satisfied.');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      toast.success('Archive Vault Created', `Welcome to Echoes, ${name.trim()}!`);
      router.push('/dashboard');
    } catch (err: unknown) {
      let errorText = 'An unexpected error occurred during account creation.';
      if (err instanceof ApiClientError) {
        if (err.isConflict) {
          errorText = 'An account with this email address already exists. Please sign in instead.';
        } else if (err.details && Array.isArray(err.details)) {
          const detailMessages = err.details.map((d: { message: string }) => d.message).join('. ');
          errorText = detailMessages || err.message;
        } else {
          errorText = err.message || 'Registration failed. Please check your information.';
        }
      } else if (err instanceof Error) {
        errorText = err.message;
      }
      toast.error('Registration Failed', errorText);
      setErrorMessage(errorText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="relative bg-white dark:bg-[#1E2035] border-2 border-[#191A2B] dark:border-white/20 p-8 sm:p-10 rounded-sm shadow-2xl">
        {/* Floating decorative badge */}
        <div className="absolute -top-5 -right-4 z-10 pointer-events-none hidden sm:block">
          <FloatingSticker color="teal" rotate={-6}>
            ORIGINAL
          </FloatingSticker>
        </div>

        {/* Card Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="lime">NEW VAULT</Badge>

            <span className="font-mono text-[10px] text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider">
              PERSONAL CHRONICLE
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#191A2B] dark:text-[#F7F3EC] tracking-tight">
            Claim Your Vault
          </h1>
          <p className="font-sans text-sm text-[#767C9D] dark:text-[#A4AAC7] mt-2">
            Establish your digital memory sanctuary with server-enforced temporal locks.
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
              <strong className="font-semibold block text-[#FF684D]">Registration Error</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="register-name"
            type="text"
            label="Full Name"
            placeholder="Ada Lovelace"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            disabled={loading}
          />

          <Input
            id="register-email"
            type="email"
            label="Email Address"
            placeholder="ada@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="register-password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
            />

            <Input
              id="register-confirm-password"
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          {/* Real-time Password Requirements Checklist */}
          <div className="p-3 bg-[#EFE9DE]/60 dark:bg-[#25283F]/60 border border-[#191A2B]/10 dark:border-white/10 rounded-sm font-mono text-[11px] space-y-1">
            <span className="text-[#767C9D] dark:text-[#A4AAC7] uppercase tracking-wider block font-semibold mb-1">
              Security Requirements:
            </span>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {passwordRequirements.map((req) => (
                <div
                  key={req.label}
                  className={`flex items-center gap-1.5 font-medium ${
                    req.met
                      ? 'text-[#1F8A7E] dark:text-[#39BFAE]'
                      : 'text-[#DC2626] dark:text-[#FF684D]'
                  }`}
                >
                  {req.met ? <CheckIcon size={12} /> : <CloseIcon size={12} />}
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
            {confirmPassword.length > 0 && (
              <div
                className={`flex items-center gap-1.5 pt-1 border-t border-[#191A2B]/5 dark:border-white/5 font-medium ${
                  passwordsMatch
                    ? 'text-[#1F8A7E] dark:text-[#39BFAE]'
                    : 'text-[#DC2626] dark:text-[#FF684D]'
                }`}
              >
                {passwordsMatch ? <CheckIcon size={12} /> : <CloseIcon size={12} />}
                <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="cobalt"
            size="lg"
            loading={loading}
            disabled={loading || !isFormValid}
            icon={<ArrowRightIcon size={16} />}
            iconPosition="right"
            className="w-full justify-center mt-3"
          >
            {loading ? 'Creating Vault...' : 'Create Account'}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-[#191A2B]/10 dark:border-white/10 text-center">
          <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7]">
            Already have a memory vault?{' '}
            <Link
              href="/login"
              className="text-[#4F66E8] dark:text-[#FF684D] font-semibold hover:underline underline-offset-2 ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F3EC] dark:bg-[#191A2B] text-[#191A2B] dark:text-[#F7F3EC]">
      <EditorialHeader />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Container size="standard">
          <Suspense
            fallback={
              <div className="max-w-lg mx-auto p-12 bg-white dark:bg-[#1E2035] rounded-sm text-center animate-pulse">
                <span className="font-mono text-xs text-[#767C9D]">
                  Loading registration portal...
                </span>
              </div>
            }
          >
            <RegisterForm />
          </Suspense>
        </Container>
      </main>
    </div>
  );
}

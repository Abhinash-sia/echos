'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Container } from '@/components/layout/Container';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { authApi } from '@/lib/api/auth';
import { ApiClientError } from '@/lib/api/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import {
  SunIcon,
  MoonIcon,
  SparklesIcon,
  KeyIcon,
  ShieldCheckIcon,
  LogOutIcon,
  AlertCircleIcon,
  CheckIcon,
} from '@/components/icons/Icons';

type ThemeMode = 'light' | 'dark' | 'system';

function subscribeTheme(callback: () => void) {
  window.addEventListener('storage', callback);
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    media.removeEventListener('change', callback);
  };
}

function getThemeSnapshot(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem('echoes-theme');
  if (saved === 'dark') return 'dark';
  if (saved === 'light') return 'light';
  return 'system';
}

function getServerThemeSnapshot(): ThemeMode {
  return 'system';
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Theme State synchronized via external store
  const selectedTheme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  // Logout Dialog State
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Theme switcher handler
  const handleThemeChange = (mode: ThemeMode) => {
    if (mode === 'system') {
      localStorage.removeItem('echoes-theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } else if (mode === 'dark') {
      localStorage.setItem('echoes-theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      localStorage.setItem('echoes-theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    window.dispatchEvent(new Event('storage'));
    toast.info('Theme preference updated', `Visual style set to ${mode.toUpperCase()}`);
  };

  // Change Password submit handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Client-side validations
    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    const complexity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!complexity.test(newPassword)) {
      setPasswordError(
        'New password must contain at least one uppercase letter, one lowercase letter, and one number.'
      );
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Confirmation password does not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const message = await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess(message || 'Password changed successfully. Other sessions invalidated.');
      toast.success(
        'Password Updated Successfully',
        'Your cryptographic credentials have been refreshed.'
      );

      // Reset fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      console.error('Password change error:', err);
      if (err instanceof ApiClientError) {
        if (err.isRateLimited) {
          const msg = 'Too many attempts. Please wait 15 minutes before retrying.';
          setPasswordError(msg);
          toast.error('Rate Limited', msg);
        } else {
          setPasswordError(err.message);
          toast.error('Password Update Failed', err.message);
        }
      } else if (err instanceof Error) {
        setPasswordError(err.message);
        toast.error('Password Update Failed', err.message);
      } else {
        const msg = 'An unexpected error occurred while changing your password.';
        setPasswordError(msg);
        toast.error('Error', msg);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.info('Signed Out', 'Your session has ended securely.');
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  return (
    <AppShell>
      <div className="py-8 sm:py-12 flex-1">
        <Container size="wide">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#191A2B]/10 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-2 font-mono text-xs uppercase tracking-widest text-[#767C9D] dark:text-[#A4AAC7]">
                <Link href="/dashboard" className="hover:text-[#FF684D] transition-colors">
                  Vault
                </Link>
                <span>/</span>
                <span className="text-[#191A2B] dark:text-[#F7F3EC] font-semibold">Settings</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#191A2B] dark:text-[#F7F3EC] font-normal">
                Account & Security Settings
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="coral"
                size="sm"
                onClick={() => setShowLogoutDialog(true)}
                icon={<LogOutIcon size={14} />}
              >
                Sign Out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: Password & Theme Controls */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              {/* Section 1: Change Password */}
              <div className="bg-[#EFE9DE] dark:bg-[#1E2035] border border-[#191A2B]/15 dark:border-white/15 rounded-sm p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xs bg-[#FF684D]/15 text-[#FF684D] flex items-center justify-center">
                    <KeyIcon size={18} />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#191A2B] dark:text-[#F7F3EC]">
                      Change Password
                    </h2>
                    <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-0.5">
                      Update your vault passphrase. All other active sessions will be revoked.
                    </p>
                  </div>
                </div>

                {passwordSuccess && (
                  <div
                    role="status"
                    className="mb-6 p-4 rounded-xs bg-[#2D9CDB]/15 border border-[#2D9CDB]/40 flex items-start gap-3 text-xs text-[#191A2B] dark:text-[#F7F3EC]"
                  >
                    <CheckIcon size={16} className="text-[#2D9CDB] mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold block">{passwordSuccess}</span>
                      <span className="opacity-90">
                        Token version incremented to v{(user?.tokenVersion ?? 1) + 1}. Current
                        session re-authenticated.
                      </span>
                    </div>
                  </div>
                )}

                {passwordError && (
                  <div
                    role="alert"
                    className="mb-6 p-4 rounded-xs bg-[#FF684D]/15 border border-[#FF684D]/40 flex items-start gap-3 text-xs text-[#FF684D]"
                  >
                    <AlertCircleIcon size={16} className="mt-0.5 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  <Input
                    label="Current Password"
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                  />

                  <Input
                    label="New Password"
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters with letter & number"
                    helperText="Must be 8+ characters with uppercase, lowercase, and digit"
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />

                  <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
                    <Link
                      href="/login#recover"
                      className="text-xs font-mono text-[#767C9D] dark:text-[#A4AAC7] hover:text-[#FF684D] transition-colors"
                    >
                      Need password recovery? →
                    </Link>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={isChangingPassword}
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Section 2: Visual Theme Controls */}
              <div className="bg-[#EFE9DE] dark:bg-[#1E2035] border border-[#191A2B]/15 dark:border-white/15 rounded-sm p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xs bg-[#4F66E8]/15 text-[#4F66E8] flex items-center justify-center">
                    <SparklesIcon size={18} />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#191A2B] dark:text-[#F7F3EC]">
                      Appearance & Theme
                    </h2>
                    <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] mt-0.5">
                      Select your preferred editorial atmosphere.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: Light */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`p-4 rounded-sm border text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
                      selectedTheme === 'light'
                        ? 'border-[#FF684D] bg-[#F7F3EC] dark:bg-[#25283F] shadow-neu-raised'
                        : 'border-[#191A2B]/15 dark:border-white/10 bg-[#F7F3EC]/50 dark:bg-[#191A2B]/40 hover:border-[#191A2B]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 text-[#FF684D]">
                      <SunIcon size={20} />
                      {selectedTheme === 'light' && (
                        <span className="w-2 h-2 rounded-full bg-[#FF684D]" />
                      )}
                    </div>
                    <span className="font-serif text-sm font-semibold text-[#191A2B] dark:text-[#F7F3EC] block">
                      Editorial Light
                    </span>
                    <span className="font-sans text-[11px] text-[#767C9D] dark:text-[#A4AAC7] mt-1 block">
                      Warm cream paper with high-contrast ink
                    </span>
                  </button>

                  {/* Option 2: Dark */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`p-4 rounded-sm border text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
                      selectedTheme === 'dark'
                        ? 'border-[#FF684D] bg-[#F7F3EC] dark:bg-[#25283F] shadow-neu-raised'
                        : 'border-[#191A2B]/15 dark:border-white/10 bg-[#F7F3EC]/50 dark:bg-[#191A2B]/40 hover:border-[#191A2B]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 text-[#2D9CDB]">
                      <MoonIcon size={20} />
                      {selectedTheme === 'dark' && (
                        <span className="w-2 h-2 rounded-full bg-[#2D9CDB]" />
                      )}
                    </div>
                    <span className="font-serif text-sm font-semibold text-[#191A2B] dark:text-[#F7F3EC] block">
                      Cinematic Dark
                    </span>
                    <span className="font-sans text-[11px] text-[#767C9D] dark:text-[#A4AAC7] mt-1 block">
                      Deep nocturne indigo with vivid accents
                    </span>
                  </button>

                  {/* Option 3: System */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('system')}
                    className={`p-4 rounded-sm border text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
                      selectedTheme === 'system'
                        ? 'border-[#FF684D] bg-[#F7F3EC] dark:bg-[#25283F] shadow-neu-raised'
                        : 'border-[#191A2B]/15 dark:border-white/10 bg-[#F7F3EC]/50 dark:bg-[#191A2B]/40 hover:border-[#191A2B]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 text-[#4F66E8]">
                      <SparklesIcon size={20} />
                      {selectedTheme === 'system' && (
                        <span className="w-2 h-2 rounded-full bg-[#4F66E8]" />
                      )}
                    </div>
                    <span className="font-serif text-sm font-semibold text-[#191A2B] dark:text-[#F7F3EC] block">
                      System Sync
                    </span>
                    <span className="font-sans text-[11px] text-[#767C9D] dark:text-[#A4AAC7] mt-1 block">
                      Automatically follow OS brightness
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Session Info, Account Policy, Logout */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Session & Cryptographic Info Card */}
              <div className="bg-[#EFE9DE] dark:bg-[#1E2035] border border-[#191A2B]/15 dark:border-white/15 rounded-sm p-6 sm:p-7 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheckIcon size={18} className="text-[#2D9CDB]" />
                  <h3 className="font-serif text-lg font-normal text-[#191A2B] dark:text-[#F7F3EC]">
                    Session Integrity
                  </h3>
                </div>

                <div className="flex flex-col gap-3 font-sans text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#191A2B]/10 dark:border-white/10">
                    <span className="font-mono text-[#767C9D] dark:text-[#A4AAC7]">
                      Token Version
                    </span>
                    <span className="font-mono font-semibold text-[#191A2B] dark:text-[#F7F3EC]">
                      v{user?.tokenVersion ?? 1}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#191A2B]/10 dark:border-white/10">
                    <span className="font-mono text-[#767C9D] dark:text-[#A4AAC7]">
                      Cookie Security
                    </span>
                    <span className="font-mono text-[10px] text-[#2D9CDB] bg-[#2D9CDB]/10 px-2 py-0.5 rounded-xs">
                      HttpOnly · SameSite=Lax
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#191A2B]/10 dark:border-white/10">
                    <span className="font-mono text-[#767C9D] dark:text-[#A4AAC7]">
                      Key Derivation
                    </span>
                    <span className="font-mono text-[10px] text-[#4F66E8] bg-[#4F66E8]/10 px-2 py-0.5 rounded-xs">
                      Argon2id (m=64MB, t=3, p=4)
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#191A2B]/10 dark:border-white/10">
                    <span className="font-mono text-[#767C9D] dark:text-[#A4AAC7]">
                      Active User ID
                    </span>
                    <span className="font-mono text-[10px] text-[#767C9D] dark:text-[#A4AAC7] truncate max-w-[140px]">
                      {user?._id ? String(user._id) : 'Unavailable'}
                    </span>
                  </div>
                </div>

                <p className="font-sans text-[11px] text-[#767C9D] dark:text-[#A4AAC7] mt-4 leading-relaxed">
                  Every password alteration increments your Token Version on the server,
                  guaranteeing that stolen tokens or dangling sessions are instantly neutralized.
                </p>
              </div>

              {/* Password Recovery Direct Link */}
              <div className="bg-[#EFE9DE] dark:bg-[#1E2035] border border-[#191A2B]/15 dark:border-white/15 rounded-sm p-6 shadow-sm">
                <h3 className="font-serif text-lg font-normal text-[#191A2B] dark:text-[#F7F3EC] mb-2">
                  Emergency Recovery
                </h3>
                <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] leading-relaxed mb-4">
                  If you suspect unauthorized access or forget your password in the future, you can
                  initiate a token-based reset via your registered email address.
                </p>
                <Link href="/login#recover">
                  <Button variant="ghost" size="sm" className="w-full justify-center">
                    Navigate to Recovery Entrypoint →
                  </Button>
                </Link>
              </div>

              {/* Account Retention / Deletion Policy Notice */}
              <div className="p-5 rounded-sm bg-[#F7F3EC] dark:bg-[#191A2B] border border-dashed border-[#191A2B]/20 dark:border-white/20 text-xs">
                <div className="flex items-center gap-2 mb-2 font-mono text-[10px] uppercase tracking-wider text-[#FF684D]">
                  <AlertCircleIcon size={14} />
                  <span>Account Retention Notice</span>
                </div>
                <p className="font-sans text-xs text-[#767C9D] dark:text-[#A4AAC7] leading-relaxed">
                  In compliance with temporal archival integrity rules, account deletion is
                  restricted. Self-service deletion is disabled to prevent orphan time capsules
                  scheduled for future arrival dates. To close your archive permanently, contact the
                  system custodian.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Confirmation Dialog for Logout */}
      <ConfirmationDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out of Archive?"
        description="Your current cryptographic session cookie will be cleared. You will need your email and password to re-enter."
        confirmLabel="Sign Out Now"
        cancelLabel="Stay In Vault"
        variant="warning"
        isConfirming={isLoggingOut}
      />
    </AppShell>
  );
}

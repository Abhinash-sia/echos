import { apiClient } from './client';
import { ApiResponse, AuthResponseData, UserResponseData } from './types';
import {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from '@/validations/auth';
import { SafeUser } from '@/models/User';

export const authApi = {
  /**
   * Log in user with credentials.
   * Returns authenticated user profile and sets HTTP-only cookie automatically.
   */
  async login(credentials: LoginInput): Promise<{ user: SafeUser; message?: string }> {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/api/auth/login', credentials);
    if (!res.data?.user) {
      throw new Error('Malformed login response: user data missing');
    }
    return {
      user: res.data.user,
      message: res.message,
    };
  },

  /**
   * Register new user account.
   * Returns newly created user profile and sets HTTP-only cookie automatically.
   */
  async register(data: RegisterInput): Promise<{ user: SafeUser; message?: string }> {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/api/auth/register', data);
    if (!res.data?.user) {
      throw new Error('Malformed registration response: user data missing');
    }
    return {
      user: res.data.user,
      message: res.message,
    };
  },

  /**
   * Log out currently authenticated session.
   * Clears HTTP-only cookie and revokes tokenVersion on server.
   */
  async logout(): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/api/auth/logout');
  },

  /**
   * Restores user session from existing HTTP-only cookie.
   * Returns sanitized SafeUser profile.
   */
  async getMe(): Promise<SafeUser> {
    const res = await apiClient.get<ApiResponse<UserResponseData>>('/api/auth/me');
    if (!res.data?.user) {
      throw new Error('Malformed user profile response');
    }
    return res.data.user;
  },

  /**
   * Trigger password reset link delivery to user email.
   */
  async forgotPassword(data: ForgotPasswordInput): Promise<string> {
    const res = await apiClient.post<ApiResponse<void>>('/api/auth/forgot-password', data);
    return res.message || 'If an account matches this email, a reset link has been dispatched.';
  },

  /**
   * Reset user password with cryptographically signed token.
   */
  async resetPassword(data: ResetPasswordInput): Promise<string> {
    const res = await apiClient.post<ApiResponse<void>>('/api/auth/reset-password', data);
    return res.message || 'Password reset successfully. You may now log in.';
  },

  /**
   * Change password for currently authenticated user.
   */
  async changePassword(data: ChangePasswordInput): Promise<string> {
    const res = await apiClient.patch<ApiResponse<void>>('/api/auth/change-password', data);
    return res.message || 'Password changed successfully.';
  },
};

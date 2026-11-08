import { SafeUser } from '@/models/User';

/**
 * Structured API Client Error class
 * Encapsulates HTTP status, backend error messages, and validation details.
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly details?: unknown;
  public readonly raw?: unknown;

  constructor(status: number, message: string, details?: unknown, raw?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
    this.raw = raw;

    // Maintains proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiClientError);
    }
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface AuthResponseData {
  user: SafeUser;
  token?: string;
}

export interface UserResponseData {
  user: SafeUser;
}

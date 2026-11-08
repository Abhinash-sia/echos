/**
 * Core TypeScript Type Definitions for Echoes
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export * from './memory';
export * from './capsule';
export * from './timeline';

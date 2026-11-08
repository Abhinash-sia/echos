import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClientError, apiClient } from '@/lib/api';

describe('Typed API Client & Error Handling', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('ApiClientError', () => {
    it('should accurately capture status, message, and details', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      const err = new ApiClientError(400, 'Validation failed', details, { success: false });

      expect(err.name).toBe('ApiClientError');
      expect(err.status).toBe(400);
      expect(err.message).toBe('Validation failed');
      expect(err.details).toEqual(details);
      expect(err.isClientError).toBe(true);
      expect(err.isServerError).toBe(false);
      expect(err.isUnauthenticated).toBe(false);
      expect(err.isForbidden).toBe(false);
      expect(err.isNotFound).toBe(false);
    });

    it('should correctly identify 401 unauthenticated errors', () => {
      const err = new ApiClientError(401, 'Authentication required');
      expect(err.isUnauthenticated).toBe(true);
      expect(err.isClientError).toBe(true);
    });

    it('should correctly identify 403 forbidden errors', () => {
      const err = new ApiClientError(403, 'Access denied');
      expect(err.isForbidden).toBe(true);
    });

    it('should correctly identify 404 not found errors', () => {
      const err = new ApiClientError(404, 'Resource not found');
      expect(err.isNotFound).toBe(true);
    });

    it('should correctly identify 409 conflict errors', () => {
      const err = new ApiClientError(409, 'Conflict detected');
      expect(err.isConflict).toBe(true);
    });

    it('should correctly identify 429 rate-limited errors', () => {
      const err = new ApiClientError(429, 'Too many requests');
      expect(err.isRateLimited).toBe(true);
    });

    it('should correctly identify 500 server errors', () => {
      const err = new ApiClientError(500, 'Internal server error');
      expect(err.isServerError).toBe(true);
      expect(err.isClientError).toBe(false);
    });
  });

  describe('request() with credentials: include', () => {
    it('should enforce credentials: include on all requests', async () => {
      let capturedInit: RequestInit | undefined;

      global.fetch = vi.fn().mockImplementation((_url, init) => {
        capturedInit = init;
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: { test: 123 } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      await apiClient.get('/api/test');

      expect(capturedInit).toBeDefined();
      expect(capturedInit?.credentials).toBe('include');
    });

    it('should format search params properly into URL query string', async () => {
      let capturedUrl = '';

      global.fetch = vi.fn().mockImplementation((url) => {
        capturedUrl = String(url);
        return Promise.resolve(
          new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      await apiClient.get('/api/memories', {
        params: { limit: 10, page: 2, tag: 'travel', empty: null },
      });

      expect(capturedUrl).toContain('limit=10');
      expect(capturedUrl).toContain('page=2');
      expect(capturedUrl).toContain('tag=travel');
      expect(capturedUrl).not.toContain('empty=');
    });

    it('should set Content-Type application/json for object bodies', async () => {
      let capturedHeaders: Headers | undefined;
      let capturedBody: string | undefined;

      global.fetch = vi.fn().mockImplementation((_url, init) => {
        capturedHeaders = init.headers;
        capturedBody = init.body;
        return Promise.resolve(
          new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      await apiClient.post('/api/auth/login', { email: 'a@b.com', password: 'secretPassword1' });

      expect(capturedHeaders?.get('Content-Type')).toBe('application/json');
      expect(capturedBody).toBe(JSON.stringify({ email: 'a@b.com', password: 'secretPassword1' }));
    });

    it('should extract structured error details on 400 Bad Request', async () => {
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: false,
              error: 'Validation failed',
              details: [{ field: 'email', message: 'Invalid email address' }],
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        );
      });

      try {
        await apiClient.post('/api/auth/register', { email: 'invalid' });
        expect.unreachable('Should have thrown an ApiClientError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ApiClientError);
        const apiErr = err as ApiClientError;
        expect(apiErr.status).toBe(400);
        expect(apiErr.message).toBe('Validation failed');
        expect(apiErr.details).toEqual([{ field: 'email', message: 'Invalid email address' }]);
      }
    });

    it('should handle network connection failures gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      await expect(apiClient.get('/api/health')).rejects.toThrow(ApiClientError);
      await expect(apiClient.get('/api/health')).rejects.toMatchObject({
        status: 0,
        message: 'Network error: Connection refused',
      });
    });
  });

  describe('HTTP Verb Methods', () => {
    it('supports PATCH, PUT, and DELETE verbs', async () => {
      const methodsUsed: string[] = [];

      global.fetch = vi.fn().mockImplementation((_url, init) => {
        methodsUsed.push(init.method);
        return Promise.resolve(
          new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      await apiClient.patch('/api/memories/1', { title: 'Updated' });
      await apiClient.put('/api/memories/1', { title: 'Put' });
      await apiClient.delete('/api/memories/1');

      expect(methodsUsed).toEqual(['PATCH', 'PUT', 'DELETE']);
    });
  });
});

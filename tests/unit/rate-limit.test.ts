import { describe, it, expect, beforeEach } from 'vitest';
import { getClientIp, checkRateLimit, resetRateLimits } from '@/lib/security/rate-limit';

describe('Rate Limiting & IP Extraction Unit Tests', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  describe('getClientIp', () => {
    it('should extract trusted cf-connecting-ip when present', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'cf-connecting-ip': '203.0.113.195',
          'x-real-ip': '198.51.100.1',
          'x-forwarded-for': '192.0.2.1',
        },
      });

      expect(getClientIp(request)).toBe('203.0.113.195');
    });

    it('should extract x-real-ip when cf-connecting-ip is missing', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-real-ip': '198.51.100.25',
          'x-forwarded-for': '192.0.2.1',
        },
      });

      expect(getClientIp(request)).toBe('198.51.100.25');
    });

    it('should extract the rightmost valid IP from multi-hop x-forwarded-for to defeat client spoofing', () => {
      // In a reverse proxy setup, client sends spoofed prefix "10.0.0.1",
      // and trusted upstream proxy appends the real remote address "198.51.100.50"
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '10.0.0.1, 172.16.0.1, 198.51.100.50',
        },
      });

      expect(getClientIp(request)).toBe('198.51.100.50');
    });

    it('should support valid IPv6 addresses including compressed notation', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-real-ip': '2001:db8::1',
        },
      });

      expect(getClientIp(request)).toBe('2001:db8::1');
    });

    it('should reject malformed or non-IP strings and fallback to 127.0.0.1', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'cf-connecting-ip': 'not-an-ip-address',
          'x-real-ip': 'evil<script>',
          'x-forwarded-for': 'random_payload, another_invalid',
        },
      });

      expect(getClientIp(request)).toBe('127.0.0.1');
    });

    it('should fallback to 127.0.0.1 when no proxy headers are present', () => {
      const request = new Request('http://localhost:3000/api/test');
      expect(getClientIp(request)).toBe('127.0.0.1');
    });
  });

  describe('checkRateLimit Sliding Window', () => {
    it('should allow requests within limit and decrement remaining counter', () => {
      const res1 = checkRateLimit('192.168.1.1', 'login', 3, 60);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = checkRateLimit('192.168.1.1', 'login', 3, 60);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = checkRateLimit('192.168.1.1', 'login', 3, 60);
      expect(res3.allowed).toBe(true);
      expect(res3.remaining).toBe(0);
    });

    it('should reject excess requests with retryAfterSeconds once limit is exceeded', () => {
      // Consume allowance
      checkRateLimit('192.168.1.2', 'test-action', 2, 60);
      checkRateLimit('192.168.1.2', 'test-action', 2, 60);

      const blocked = checkRateLimit('192.168.1.2', 'test-action', 2, 60);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
      expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
    });

    it('should segregate rate limits across different actions and keys', () => {
      checkRateLimit('192.168.1.3', 'action-a', 1, 60);

      // Same key, different action -> allowed
      const differentAction = checkRateLimit('192.168.1.3', 'action-b', 1, 60);
      expect(differentAction.allowed).toBe(true);

      // Different key, same action -> allowed
      const differentKey = checkRateLimit('192.168.1.4', 'action-a', 1, 60);
      expect(differentKey.allowed).toBe(true);
    });

    it('should reset limits when resetRateLimits() is called', () => {
      checkRateLimit('192.168.1.5', 'action', 1, 60);
      const blockedBefore = checkRateLimit('192.168.1.5', 'action', 1, 60);
      expect(blockedBefore.allowed).toBe(false);

      resetRateLimits();

      const allowedAfter = checkRateLimit('192.168.1.5', 'action', 1, 60);
      expect(allowedAfter.allowed).toBe(true);
    });
  });
});

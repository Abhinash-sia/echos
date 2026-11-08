import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { timelineApi } from '@/lib/api/timeline';

describe('Timeline API Client Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('queries GET /api/timeline with type, date range, and sortOrder params', async () => {
    let capturedUrl = '';

    global.fetch = vi.fn().mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: [
              {
                id: 'item_1',
                _id: 'item_1',
                type: 'memory',
                title: 'Cedar Temple Reflection',
                date: '2026-10-15T10:00:00.000Z',
                content: 'Walking through ancient forest.',
                tags: ['nature', 'japan'],
                photos: [],
                createdAt: '2026-10-15T10:00:00.000Z',
                updatedAt: '2026-10-15T10:00:00.000Z',
              },
              {
                id: 'item_2',
                _id: 'item_2',
                type: 'capsule',
                title: 'Letter to Future Self',
                date: '2027-01-01T00:00:00.000Z',
                unlockDate: '2027-01-01T00:00:00.000Z',
                sealedAt: '2026-10-15T10:00:00.000Z',
                isLocked: true,
                isOpened: false,
                openedAt: null,
                createdAt: '2026-10-15T10:00:00.000Z',
                updatedAt: '2026-10-15T10:00:00.000Z',
              },
            ],
            pagination: {
              total: 2,
              limit: 10,
              hasNextPage: false,
              nextCursor: null,
              prevCursor: null,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    const res = await timelineApi.getTimeline({
      type: 'all',
      startDate: '2026-10-01',
      endDate: '2027-01-01',
      sortOrder: 'asc',
      limit: 10,
    });

    expect(capturedUrl).toContain('/api/timeline');
    expect(capturedUrl).toContain('type=all');
    expect(capturedUrl).toContain('startDate=2026-10-01');
    expect(capturedUrl).toContain('endDate=2027-01-01');
    expect(capturedUrl).toContain('sortOrder=asc');
    expect(capturedUrl).toContain('limit=10');

    expect(res.data.length).toBe(2);
    expect(res.data[0].type).toBe('memory');
    expect(res.data[1].type).toBe('capsule');
    expect(res.pagination.total).toBe(2);
  });

  it('passes cursor param correctly for deterministic cursor pagination', async () => {
    let capturedUrl = '';

    global.fetch = vi.fn().mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: [],
            pagination: {
              total: 10,
              limit: 5,
              hasNextPage: false,
              nextCursor: null,
              prevCursor: 'prev_cursor_token',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    await timelineApi.getTimeline({
      cursor: 'test_cursor_token',
      limit: 5,
    });

    expect(capturedUrl).toContain('cursor=test_cursor_token');
    expect(capturedUrl).toContain('limit=5');
  });

  it('filters by memory type specifically', async () => {
    let capturedUrl = '';

    global.fetch = vi.fn().mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: [],
            pagination: {
              total: 0,
              limit: 10,
              hasNextPage: false,
              nextCursor: null,
              prevCursor: null,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    await timelineApi.getTimeline({ type: 'memory' });
    expect(capturedUrl).toContain('type=memory');
  });

  it('filters by capsule type specifically', async () => {
    let capturedUrl = '';

    global.fetch = vi.fn().mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: [],
            pagination: {
              total: 0,
              limit: 10,
              hasNextPage: false,
              nextCursor: null,
              prevCursor: null,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    await timelineApi.getTimeline({ type: 'capsule' });
    expect(capturedUrl).toContain('type=capsule');
  });
});

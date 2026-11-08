import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { capsulesApi } from '@/lib/api/capsules';
import { ApiClientError } from '@/lib/api/types';

describe('Capsules API Client Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('getCapsules queries /api/capsules with status filter and pagination', async () => {
    let capturedUrl = '';

    global.fetch = vi.fn().mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: [
              {
                _id: 'capsule_1',
                userId: 'user_1',
                title: 'Graduation Milestone',
                unlockDate: '2028-06-01T00:00:00.000Z',
                sealedAt: '2026-10-15T00:00:00.000Z',
                isOpened: false,
                isLocked: true,
                createdAt: '2026-10-15T00:00:00.000Z',
                updatedAt: '2026-10-15T00:00:00.000Z',
              },
            ],
            pagination: {
              page: 1,
              limit: 9,
              total: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    const res = await capsulesApi.getCapsules({
      page: 1,
      limit: 9,
      status: 'locked',
      sortOrder: 'asc',
    });

    expect(capturedUrl).toContain('/api/capsules');
    expect(capturedUrl).toContain('status=locked');
    expect(capturedUrl).toContain('sortOrder=asc');
    expect(capturedUrl).toContain('page=1');
    expect(capturedUrl).toContain('limit=9');

    expect(res.data.length).toBe(1);
    expect(res.data[0].title).toBe('Graduation Milestone');
    expect(res.data[0].isLocked).toBe(true);
  });

  it('createCapsule sends POST /api/capsules with title, message, and future unlockDate', async () => {
    let capturedMethod = '';
    let capturedBody = '';

    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedMethod = init.method;
      capturedBody = init.body;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            message: 'Time capsule sealed successfully.',
            data: {
              _id: 'capsule_new',
              userId: 'user_1',
              title: 'Letter to 2030',
              unlockDate: '2030-01-01T00:00:00.000Z',
              sealedAt: '2026-10-15T00:00:00.000Z',
              isOpened: false,
              isLocked: true,
              createdAt: '2026-10-15T00:00:00.000Z',
              updatedAt: '2026-10-15T00:00:00.000Z',
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    const created = await capsulesApi.createCapsule({
      title: 'Letter to 2030',
      message: 'Remember the courage you had in 2026.',
      unlockDate: '2030-01-01T00:00:00.000Z',
    });

    expect(capturedMethod).toBe('POST');
    const parsed = JSON.parse(capturedBody);
    expect(parsed.title).toBe('Letter to 2030');
    expect(parsed.message).toBe('Remember the courage you had in 2026.');
    expect(created._id).toBe('capsule_new');
    expect(created.isLocked).toBe(true);
  });

  it('getCapsule returns full revealed contents when unlocked on server', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              _id: 'capsule_open',
              userId: 'user_1',
              title: 'Past Journey',
              message: 'This is the revealed secret letter.',
              unlockDate: '2025-01-01T00:00:00.000Z',
              sealedAt: '2024-01-01T00:00:00.000Z',
              isOpened: true,
              isLocked: false,
              photos: [],
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2025-01-01T00:00:00.000Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    const capsule = await capsulesApi.getCapsule('capsule_open');
    expect(capsule.title).toBe('Past Journey');
    expect(capsule.message).toBe('This is the revealed secret letter.');
    expect(capsule.isLocked).toBe(false);
  });

  it('getCapsule throws ApiClientError with status 403 when capsule is locked by server', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Time capsule is sealed and locked until 2030-01-01T00:00:00.000Z.',
            unlockDate: '2030-01-01T00:00:00.000Z',
            isLocked: true,
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    await expect(capsulesApi.getCapsule('capsule_locked')).rejects.toThrow(ApiClientError);

    try {
      await capsulesApi.getCapsule('capsule_locked');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ApiClientError);
      const apiErr = err as ApiClientError;
      expect(apiErr.status).toBe(403);
      expect(apiErr.isForbidden).toBe(true);
      const raw = apiErr.raw as { unlockDate: string; isLocked: boolean };
      expect(raw.unlockDate).toBe('2030-01-01T00:00:00.000Z');
      expect(raw.isLocked).toBe(true);
    }
  });

  it('openCapsule calls POST /api/capsules/:id/open and returns unsealed contents', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    global.fetch = vi.fn().mockImplementation((url, init) => {
      capturedUrl = String(url);
      capturedMethod = init.method;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            message: 'Time capsule unsealed successfully.',
            data: {
              _id: 'capsule_now_open',
              userId: 'user_1',
              title: 'Opening Ceremony',
              message: 'Finally unlocked!',
              isOpened: true,
              isLocked: false,
              openedAt: '2026-11-01T00:00:00.000Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    const unsealed = await capsulesApi.openCapsule('capsule_now_open');
    expect(capturedUrl).toContain('/api/capsules/capsule_now_open/open');
    expect(capturedMethod).toBe('POST');
    expect(unsealed.isOpened).toBe(true);
    expect(unsealed.message).toBe('Finally unlocked!');
  });

  it('deleteCapsule calls DELETE /api/capsules/:id', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    global.fetch = vi.fn().mockImplementation((url, init) => {
      capturedUrl = String(url);
      capturedMethod = init.method;
      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    await capsulesApi.deleteCapsule('capsule_to_delete');
    expect(capturedUrl).toContain('/api/capsules/capsule_to_delete');
    expect(capturedMethod).toBe('DELETE');
  });
});

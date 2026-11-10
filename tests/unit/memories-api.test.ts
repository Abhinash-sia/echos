import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { memoriesApi } from '@/lib/api/memories';

describe('Memories API Client & Photo Management', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('getMemories queries /api/memories with correct search and sort params', async () => {
    let capturedUrl = '';

    global.fetch = vi.fn().mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: [
              {
                _id: '507f1f77bcf86cd799439011',
                title: 'Autumn Rain',
                content: 'Reflective silence in Kyoto cedar temple.',
                memoryDate: '2026-10-15T00:00:00.000Z',
                tags: ['travel', 'rain'],
                photos: [],
              },
            ],
            pagination: {
              page: 1,
              limit: 8,
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

    const res = await memoriesApi.getMemories({
      search: 'Kyoto',
      tag: 'travel',
      sortOrder: 'desc',
      page: 1,
      limit: 8,
    });

    expect(capturedUrl).toContain('search=Kyoto');
    expect(capturedUrl).toContain('tag=travel');
    expect(capturedUrl).toContain('sortOrder=desc');
    expect(res.data.length).toBe(1);
    expect(res.data[0].title).toBe('Autumn Rain');
  });

  it('createMemory posts title, content, memoryDate, and tags', async () => {
    let capturedBody: string | undefined;

    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedBody = init.body;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              _id: '507f1f77bcf86cd799439022',
              title: 'New Memory',
              content: 'Story content here',
              memoryDate: '2026-10-20',
              tags: ['analog'],
              photos: [],
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    const created = await memoriesApi.createMemory({
      title: 'New Memory',
      content: 'Story content here',
      memoryDate: '2026-10-20',
      tags: ['analog'],
    });

    expect(created.title).toBe('New Memory');
    expect(capturedBody).toBeDefined();
    const parsed = JSON.parse(capturedBody!);
    expect(parsed.title).toBe('New Memory');
    expect(parsed.tags).toEqual(['analog']);
  });

  it('updateMemory sends PATCH with partial fields', async () => {
    let capturedMethod = '';
    let capturedBody = '';

    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedMethod = init.method;
      capturedBody = init.body;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              _id: '507f1f77bcf86cd799439022',
              title: 'Revised Title',
              content: 'Story content here',
              memoryDate: '2026-10-20',
              tags: ['analog'],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    const updated = await memoriesApi.updateMemory('507f1f77bcf86cd799439022', {
      title: 'Revised Title',
    });

    expect(capturedMethod).toBe('PATCH');
    expect(updated.title).toBe('Revised Title');
    expect(JSON.parse(capturedBody).title).toBe('Revised Title');
  });

  it('deleteMemory sends DELETE request', async () => {
    let capturedMethod = '';

    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedMethod = init.method;
      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    await memoriesApi.deleteMemory('507f1f77bcf86cd799439022');
    expect(capturedMethod).toBe('DELETE');
  });

  it('uploadPhoto sends multipart FormData', async () => {
    let capturedBody: unknown;

    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedBody = init.body;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              photo: {
                _id: 'photo_999',
                publicId: 'echoes/photos/sample_photo',
                signedUrl: 'https://res.cloudinary.com/signed/sample.jpg',
              },
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    const dummyFile = new File(['fake image bytes'], 'test.jpg', { type: 'image/jpeg' });
    const photo = await memoriesApi.uploadPhoto(
      '507f1f77bcf86cd799439022',
      dummyFile,
      'Cedar door'
    );

    expect(photo.publicId).toBe('echoes/photos/sample_photo');
    expect(photo.signedUrl).toContain('cloudinary.com');
    expect(capturedBody).toBeInstanceOf(FormData);
  });

  it('uploadPhoto supports direct MemoryPhoto payload returned by /api/memories/[id]/photos', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              _id: 'photo_direct_1',
              publicId: 'echoes/photos/direct_photo',
              signedUrl: 'https://res.cloudinary.com/signed/direct.jpg',
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    const dummyFile = new File(['fake image bytes'], 'direct.jpg', { type: 'image/jpeg' });
    const photo = await memoriesApi.uploadPhoto('507f1f77bcf86cd799439022', dummyFile);

    expect(photo._id).toBe('photo_direct_1');
    expect(photo.publicId).toBe('echoes/photos/direct_photo');
    expect(photo.signedUrl).toContain('cloudinary.com');
  });

  it('deletePhoto sends DELETE to memory photo sub-resource', async () => {
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

    await memoriesApi.deletePhoto('507f1f77bcf86cd799439022', 'photo_999');
    expect(capturedUrl).toContain('/api/memories/507f1f77bcf86cd799439022/photos/photo_999');
    expect(capturedMethod).toBe('DELETE');
  });
});

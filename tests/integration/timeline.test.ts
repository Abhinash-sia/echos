import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { connectTestDb, closeTestDb, clearTestDb } from '../helpers/db-handler';
import { resetRateLimits } from '@/lib/security/rate-limit';
import {
  setMockCloudinary,
  resetMockCloudinary,
  MockCloudinaryUploader,
} from '@/lib/media/cloudinary';
import { TimeCapsule } from '@/models/TimeCapsule';
import { Photo } from '@/models/Photo';
import { Memory } from '@/models/Memory';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { DELETE as deleteMemoryHandler } from '@/app/api/memories/[id]/route';
import { DELETE as deleteCapsuleHandler } from '@/app/api/capsules/[id]/route';
import { GET as getTimelineHandler } from '@/app/api/timeline/route';

describe('Unified Timeline API Integration Tests (Phase 4)', () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;

  let mockUploadFn: ReturnType<typeof vi.fn>;
  let mockDestroyFn: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    resetRateLimits();

    mockUploadFn = vi.fn().mockImplementation(async (_buffer, options) => ({
      public_id: options.publicId || 'echoes/test_timeline_asset',
      secure_url:
        'https://res.cloudinary.com/test-cloud/image/authenticated/test_timeline_asset.jpg',
      format: 'jpg',
      width: 1920,
      height: 1080,
      bytes: 204800,
    }));

    mockDestroyFn = vi.fn().mockImplementation(async () => ({
      result: 'ok',
    }));

    setMockCloudinary({
      upload: mockUploadFn,
      destroy: mockDestroyFn,
    } as unknown as MockCloudinaryUploader);

    // Register User A
    const resA = await registerHandler(
      new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alice User',
          email: 'alice@example.com',
          password: 'Password123!',
        }),
      })
    );
    const dataA = await resA.json();
    userAToken = dataA.data.token;
    userAId = dataA.data.user._id;

    // Register User B
    const resB = await registerHandler(
      new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bob User',
          email: 'bob@example.com',
          password: 'Password123!',
        }),
      })
    );
    const dataB = await resB.json();
    userBToken = dataB.data.token;
    userBId = dataB.data.user._id;

    resetRateLimits();
  });

  afterEach(() => {
    resetMockCloudinary();
    vi.restoreAllMocks();
  });

  // ==========================================
  // 1. Security & Authentication
  // ==========================================
  describe('Security & Authentication', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const request = new Request('http://localhost:3000/api/timeline');
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
    });

    it('should reject invalid or malformed auth token with 401 Unauthorized', async () => {
      const request = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: 'Bearer totally_invalid_token' },
      });
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
    });

    it('should strictly isolate data: User A cannot see User B entries', async () => {
      // User B creates a memory and a capsule
      await Memory.create({
        userId: userBId,
        title: "Bob's Secret Journal",
        content: 'Top secret entry for Bob only.',
        memoryDate: new Date('2025-05-01T10:00:00.000Z'),
      });

      await TimeCapsule.create({
        userId: userBId,
        title: "Bob's Secret Capsule",
        message: 'Top secret capsule letter.',
        unlockDate: new Date('2028-01-01T00:00:00.000Z'),
        sealedAt: new Date(),
        isOpened: false,
      });

      // User A creates their own memory
      await Memory.create({
        userId: userAId,
        title: "Alice's Public Reflection",
        content: 'Reflections by Alice.',
        memoryDate: new Date('2025-06-01T10:00:00.000Z'),
      });

      // Query User A's timeline
      const reqA = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resA = await getTimelineHandler(reqA);
      const jsonA = await resA.json();

      expect(resA.status).toBe(200);
      expect(jsonA.success).toBe(true);
      expect(jsonA.data).toHaveLength(1);
      expect(jsonA.data[0].title).toBe("Alice's Public Reflection");
      expect(jsonA.pagination.total).toBe(1);

      // Verify none of Bob's data leaked
      const rawText = JSON.stringify(jsonA);
      expect(rawText).not.toContain('Bob');
      expect(rawText).not.toContain('Top secret');

      // Query User B's timeline to verify separate user space
      const reqB = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      const resB = await getTimelineHandler(reqB);
      const jsonB = await resB.json();
      expect(resB.status).toBe(200);
      expect(jsonB.data).toHaveLength(2);
      expect(JSON.stringify(jsonB)).not.toContain('Alice');
    });
  });

  // ==========================================
  // 2. Timeline Aggregation & Ordering
  // ==========================================
  describe('Timeline Aggregation & Chronological Ordering', () => {
    it('should return an empty timeline array when user has no entries', async () => {
      const request = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual([]);
      expect(json.pagination.total).toBe(0);
      expect(json.pagination.hasNextPage).toBe(false);
      expect(json.pagination.hasPrevPage).toBe(false);
    });

    it('should aggregate mixed memories and capsules sorted chronologically (ascending by default)', async () => {
      // Create entries out of chronological order
      // Entry 1: Memory on 2025-06-15
      await Memory.create({
        userId: userAId,
        title: 'Mid Summer 2025',
        content: 'Sunny afternoon in June.',
        memoryDate: new Date('2025-06-15T12:00:00.000Z'),
      });

      // Entry 2: Memory on 2024-01-01
      await Memory.create({
        userId: userAId,
        title: 'New Year 2024',
        content: 'Starting fresh in 2024.',
        memoryDate: new Date('2024-01-01T00:00:00.000Z'),
      });

      // Entry 3: Unlocked Capsule on 2025-03-01
      await TimeCapsule.create({
        userId: userAId,
        title: 'Spring 2025 Capsule',
        message: 'Unsealed spring letter.',
        unlockDate: new Date('2025-03-01T00:00:00.000Z'),
        sealedAt: new Date('2024-03-01T00:00:00.000Z'),
        isOpened: true,
      });

      // Entry 4: Future Locked Capsule on 2027-01-01
      await TimeCapsule.create({
        userId: userAId,
        title: '2027 Milestone Capsule',
        message: 'Future aspirations.',
        unlockDate: new Date('2027-01-01T00:00:00.000Z'),
        sealedAt: new Date(),
        isOpened: false,
      });

      const request = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(4);
      expect(json.pagination.total).toBe(4);

      // Verify ascending chronological order:
      // 1. New Year 2024 (Memory, 2024-01-01)
      // 2. Spring 2025 Capsule (Capsule, 2025-03-01)
      // 3. Mid Summer 2025 (Memory, 2025-06-15)
      // 4. 2027 Milestone Capsule (Capsule, 2027-01-01)
      expect(json.data[0].title).toBe('New Year 2024');
      expect(json.data[0].type).toBe('memory');
      expect(new Date(json.data[0].date).toISOString()).toBe('2024-01-01T00:00:00.000Z');

      expect(json.data[1].title).toBe('Spring 2025 Capsule');
      expect(json.data[1].type).toBe('capsule');
      expect(new Date(json.data[1].date).toISOString()).toBe('2025-03-01T00:00:00.000Z');

      expect(json.data[2].title).toBe('Mid Summer 2025');
      expect(json.data[2].type).toBe('memory');
      expect(new Date(json.data[2].date).toISOString()).toBe('2025-06-15T12:00:00.000Z');

      expect(json.data[3].title).toBe('2027 Milestone Capsule');
      expect(json.data[3].type).toBe('capsule');
      expect(new Date(json.data[3].date).toISOString()).toBe('2027-01-01T00:00:00.000Z');
    });

    it('should sort entries reverse-chronologically when sortOrder=desc', async () => {
      await Memory.create({
        userId: userAId,
        title: 'Memory 2024',
        content: 'Old memory.',
        memoryDate: new Date('2024-01-01T00:00:00.000Z'),
      });
      await Memory.create({
        userId: userAId,
        title: 'Memory 2025',
        content: 'Newer memory.',
        memoryDate: new Date('2025-01-01T00:00:00.000Z'),
      });

      const request = new Request('http://localhost:3000/api/timeline?sortOrder=desc', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data[0].title).toBe('Memory 2025');
      expect(json.data[1].title).toBe('Memory 2024');
    });

    it('should break ties deterministically using _id when timeline dates match exactly', async () => {
      const identicalDate = new Date('2025-10-10T12:00:00.000Z');

      const mem1 = await Memory.create({
        userId: userAId,
        title: 'Identical Date Alpha',
        content: 'Content Alpha',
        memoryDate: identicalDate,
      });

      const cap1 = await TimeCapsule.create({
        userId: userAId,
        title: 'Identical Date Beta',
        message: 'Content Beta',
        unlockDate: identicalDate,
        sealedAt: new Date('2024-01-01T00:00:00.000Z'),
        isOpened: true,
      });

      const request = new Request('http://localhost:3000/api/timeline?sortOrder=asc', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2);

      // Verify tie breaking by comparing stringified ObjectIds
      const expectedFirst = mem1._id.toString() < cap1._id.toString() ? mem1.title : cap1.title;
      const expectedSecond = mem1._id.toString() < cap1._id.toString() ? cap1.title : mem1.title;

      expect(json.data[0].title).toBe(expectedFirst);
      expect(json.data[1].title).toBe(expectedSecond);
    });
  });

  // ==========================================
  // 3. Filtering by Type and Date Range
  // ==========================================
  describe('Filtering (Type & Date Range)', () => {
    beforeEach(async () => {
      // Memory 1: 2024-05-01
      await Memory.create({
        userId: userAId,
        title: 'Memory May 2024',
        content: 'May 2024 reflection.',
        memoryDate: new Date('2024-05-01T00:00:00.000Z'),
      });

      // Memory 2: 2025-05-01
      await Memory.create({
        userId: userAId,
        title: 'Memory May 2025',
        content: 'May 2025 reflection.',
        memoryDate: new Date('2025-05-01T00:00:00.000Z'),
      });

      // Capsule 1: 2024-11-01
      await TimeCapsule.create({
        userId: userAId,
        title: 'Capsule Nov 2024',
        message: 'Nov 2024 capsule letter.',
        unlockDate: new Date('2024-11-01T00:00:00.000Z'),
        sealedAt: new Date('2024-01-01T00:00:00.000Z'),
        isOpened: true,
      });

      // Capsule 2: 2026-01-01
      await TimeCapsule.create({
        userId: userAId,
        title: 'Capsule Jan 2026',
        message: 'Jan 2026 future letter.',
        unlockDate: new Date('2026-01-01T00:00:00.000Z'),
        sealedAt: new Date(),
        isOpened: false,
      });
    });

    it('should filter only memories when type=memory', async () => {
      const request = new Request('http://localhost:3000/api/timeline?type=memory', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2);
      expect(json.data.every((i: { type: string }) => i.type === 'memory')).toBe(true);
      expect(json.pagination.total).toBe(2);
    });

    it('should filter only capsules when type=capsule', async () => {
      const request = new Request('http://localhost:3000/api/timeline?type=capsule', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2);
      expect(json.data.every((i: { type: string }) => i.type === 'capsule')).toBe(true);
      expect(json.pagination.total).toBe(2);
    });

    it('should filter entries within startDate and endDate boundary', async () => {
      // Date range: 2024-01-01 to 2024-12-31 (should include Memory May 2024 and Capsule Nov 2024)
      const request = new Request(
        'http://localhost:3000/api/timeline?startDate=2024-01-01T00:00:00.000Z&endDate=2024-12-31T23:59:59.999Z',
        { headers: { Authorization: `Bearer ${userAToken}` } }
      );
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2);
      expect(json.data[0].title).toBe('Memory May 2024');
      expect(json.data[1].title).toBe('Capsule Nov 2024');
      expect(json.pagination.total).toBe(2);
    });

    it('should reject invalid date range where startDate > endDate with 400 Bad Request', async () => {
      const request = new Request(
        'http://localhost:3000/api/timeline?startDate=2025-01-01&endDate=2024-01-01',
        { headers: { Authorization: `Bearer ${userAToken}` } }
      );
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('startDate must be less than or equal to endDate');
    });

    it('should reject invalid date format strings with 400 Bad Request', async () => {
      const request = new Request('http://localhost:3000/api/timeline?startDate=not-a-valid-date', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Invalid startDate format');
    });

    it('should reject invalid type parameter with 400 Bad Request', async () => {
      const request = new Request('http://localhost:3000/api/timeline?type=invalid_type', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
    });
  });

  // ==========================================
  // 4. Pagination (Offset & Deterministic Cursor)
  // ==========================================
  describe('Pagination (Page-Based and Cursor-Based)', () => {
    beforeEach(async () => {
      // Create 5 sequential memories
      for (let i = 1; i <= 5; i++) {
        await Memory.create({
          userId: userAId,
          title: `Memory Item #${i}`,
          content: `Content for memory ${i}`,
          memoryDate: new Date(`2025-01-0${i}T00:00:00.000Z`),
        });
      }
    });

    it('should paginate results correctly using page and limit', async () => {
      // Page 1, limit 2
      const req1 = new Request('http://localhost:3000/api/timeline?page=1&limit=2', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res1 = await getTimelineHandler(req1);
      const json1 = await res1.json();

      expect(res1.status).toBe(200);
      expect(json1.data).toHaveLength(2);
      expect(json1.data[0].title).toBe('Memory Item #1');
      expect(json1.data[1].title).toBe('Memory Item #2');
      expect(json1.pagination.total).toBe(5);
      expect(json1.pagination.totalPages).toBe(3);
      expect(json1.pagination.hasNextPage).toBe(true);
      expect(json1.pagination.hasPrevPage).toBe(false);
      expect(json1.pagination.nextCursor).toBeDefined();

      // Page 2, limit 2
      const req2 = new Request('http://localhost:3000/api/timeline?page=2&limit=2', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res2 = await getTimelineHandler(req2);
      const json2 = await res2.json();

      expect(res2.status).toBe(200);
      expect(json2.data).toHaveLength(2);
      expect(json2.data[0].title).toBe('Memory Item #3');
      expect(json2.data[1].title).toBe('Memory Item #4');
      expect(json2.pagination.hasNextPage).toBe(true);
      expect(json2.pagination.hasPrevPage).toBe(true);

      // Page 3, limit 2 (final page with 1 item remaining)
      const req3 = new Request('http://localhost:3000/api/timeline?page=3&limit=2', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res3 = await getTimelineHandler(req3);
      const json3 = await res3.json();

      expect(res3.status).toBe(200);
      expect(json3.data).toHaveLength(1);
      expect(json3.data[0].title).toBe('Memory Item #5');
      expect(json3.pagination.hasNextPage).toBe(false);
      expect(json3.pagination.hasPrevPage).toBe(true);
    });

    it('should paginate deterministically using cursor without skipping or duplicates', async () => {
      // Fetch Page 1 with limit 2
      const req1 = new Request('http://localhost:3000/api/timeline?limit=2', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res1 = await getTimelineHandler(req1);
      const json1 = await res1.json();

      expect(json1.data).toHaveLength(2);
      expect(json1.data[0].title).toBe('Memory Item #1');
      expect(json1.data[1].title).toBe('Memory Item #2');
      const cursor1 = json1.pagination.nextCursor;
      expect(cursor1).toBeTruthy();

      // Fetch Page 2 using cursor1
      const req2 = new Request(`http://localhost:3000/api/timeline?cursor=${cursor1}&limit=2`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res2 = await getTimelineHandler(req2);
      const json2 = await res2.json();

      expect(json2.data).toHaveLength(2);
      expect(json2.data[0].title).toBe('Memory Item #3');
      expect(json2.data[1].title).toBe('Memory Item #4');
      const cursor2 = json2.pagination.nextCursor;
      expect(cursor2).toBeTruthy();

      // Fetch Page 3 using cursor2
      const req3 = new Request(`http://localhost:3000/api/timeline?cursor=${cursor2}&limit=2`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res3 = await getTimelineHandler(req3);
      const json3 = await res3.json();

      expect(json3.data).toHaveLength(1);
      expect(json3.data[0].title).toBe('Memory Item #5');
      expect(json3.pagination.hasNextPage).toBe(false);
      expect(json3.pagination.nextCursor).toBeNull();
    });

    it('should reject invalid or manipulated cursor with 400 Bad Request', async () => {
      // 1. Raw corrupted string
      const reqGarbage = new Request(
        'http://localhost:3000/api/timeline?cursor=invalid_garbage_123',
        {
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );
      const resGarbage = await getTimelineHandler(reqGarbage);
      const jsonGarbage = await resGarbage.json();
      expect(resGarbage.status).toBe(400);
      expect(jsonGarbage.error).toBe('Invalid or manipulated cursor.');

      // 2. Base64 encoded JSON but with corrupted/invalid ObjectId
      const manipulated = Buffer.from(
        JSON.stringify({ date: '2025-01-01T00:00:00.000Z', id: 'not_an_object_id' })
      ).toString('base64');
      const reqManip = new Request(`http://localhost:3000/api/timeline?cursor=${manipulated}`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resManip = await getTimelineHandler(reqManip);
      const jsonManip = await resManip.json();
      expect(resManip.status).toBe(400);
      expect(jsonManip.error).toBe('Invalid or manipulated cursor.');
    });

    it('should reject invalid pagination values (page=0, limit=500)', async () => {
      const reqZeroPage = new Request('http://localhost:3000/api/timeline?page=0', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resZeroPage = await getTimelineHandler(reqZeroPage);
      expect(resZeroPage.status).toBe(400);

      const reqExcessLimit = new Request('http://localhost:3000/api/timeline?limit=500', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resExcessLimit = await getTimelineHandler(reqExcessLimit);
      expect(resExcessLimit.status).toBe(400);
    });
  });

  // ==========================================
  // 5. Critical Capsule Privacy & Date Verifications
  // ==========================================
  describe('Critical Capsule Privacy & Security Invariants', () => {
    it('should strictly redact message, photo IDs, Cloudinary IDs, and URLs for locked capsules', async () => {
      // Upload a photo owned by User A
      const photo = await Photo.create({
        userId: userAId,
        url: 'https://res.cloudinary.com/test-cloud/image/authenticated/secret_capsule_photo.jpg',
        publicId: 'echoes/secret_capsule_photo_public_id',
        format: 'jpg',
        width: 1920,
        height: 1080,
        bytes: 102400,
      });

      // Create a locked capsule with photos and private message
      const futureUnlockDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 300); // 300 days ahead
      const secretMessage = 'TOP SECRET: My deepest secret revealed only in the future.';

      await TimeCapsule.create({
        userId: userAId,
        title: 'Sealed Vault 2027',
        message: secretMessage,
        unlockDate: futureUnlockDate,
        sealedAt: new Date(),
        isOpened: false,
        photos: [photo._id],
        photoUrls: [photo.url],
      });

      const request = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);

      const entry = json.data[0];
      expect(entry.type).toBe('capsule');
      expect(entry.title).toBe('Sealed Vault 2027');
      expect(entry.isLocked).toBe(true);
      expect(entry.isOpened).toBe(false);

      // Verify strict omission of private fields
      expect(entry.content).toBeUndefined();
      expect(entry.message).toBeUndefined();
      expect(entry.photos).toBeUndefined();
      expect(entry.photoUrls).toBeUndefined();

      // Assert complete absence in serialized JSON string
      const rawSerialized = JSON.stringify(json);
      expect(rawSerialized).not.toContain(secretMessage);
      expect(rawSerialized).not.toContain('secret_capsule_photo_public_id');
      expect(rawSerialized).not.toContain(photo._id.toString());
    });

    it('should reveal capsule message and signed photo attachments once unlockDate has elapsed', async () => {
      const pastUnlockDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago

      const photo = await Photo.create({
        userId: userAId,
        url: 'https://res.cloudinary.com/test-cloud/image/authenticated/unlocked_photo.jpg',
        publicId: 'echoes/unlocked_photo_id',
        format: 'jpg',
        width: 1920,
        height: 1080,
        bytes: 102400,
      });

      await TimeCapsule.create({
        userId: userAId,
        title: 'Graduation Day Capsule',
        message: 'Congratulations on graduating!',
        unlockDate: pastUnlockDate,
        sealedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365),
        isOpened: true,
        photos: [photo._id],
      });

      const request = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const entry = json.data[0];

      expect(entry.isLocked).toBe(false);
      expect(entry.content).toBe('Congratulations on graduating!');
      expect(entry.photos).toHaveLength(1);
      expect(entry.photos[0].id).toBe(photo._id.toString());
      expect(entry.photos[0].signedUrl).toContain('mock-cloud');
    });

    it('should ignore client manipulation attempts on isLocked or timestamps', async () => {
      const futureUnlockDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 100);

      await TimeCapsule.create({
        userId: userAId,
        title: 'Protected Capsule',
        message: 'Hidden message',
        unlockDate: futureUnlockDate,
        sealedAt: new Date(),
        isOpened: false,
      });

      // Client attempts to send query parameters to trick server
      const request = new Request(
        'http://localhost:3000/api/timeline?isLocked=false&now=2099-01-01',
        { headers: { Authorization: `Bearer ${userAToken}` } }
      );
      const response = await getTimelineHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data[0].isLocked).toBe(true);
      expect(json.data[0].content).toBeUndefined();
      expect(json.data[0].message).toBeUndefined();
    });
  });

  // ==========================================
  // 6. Cross-Module Lifecycle & Photo Integrity
  // ==========================================
  describe('Cross-Module Integrity & Deletion Behavior', () => {
    it('should omit deleted memories immediately from timeline results', async () => {
      const memory = await Memory.create({
        userId: userAId,
        title: 'Temporary Memory',
        content: 'This memory will be removed.',
        memoryDate: new Date('2025-08-01T00:00:00.000Z'),
      });

      // Verify present initially
      const reqInitial = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resInitial = await getTimelineHandler(reqInitial);
      const jsonInitial = await resInitial.json();
      expect(jsonInitial.data).toHaveLength(1);

      // Delete memory via DELETE handler
      const reqDelete = new Request(`http://localhost:3000/api/memories/${memory._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resDelete = await deleteMemoryHandler(reqDelete, {
        params: Promise.resolve({ id: memory._id.toString() }),
      });
      expect(resDelete.status).toBe(200);

      // Verify no longer returned on timeline
      const reqAfter = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resAfter = await getTimelineHandler(reqAfter);
      const jsonAfter = await resAfter.json();
      expect(jsonAfter.data).toHaveLength(0);
      expect(jsonAfter.pagination.total).toBe(0);
    });

    it('should omit deleted capsules immediately from timeline results', async () => {
      const capsule = await TimeCapsule.create({
        userId: userAId,
        title: 'Temporary Capsule',
        message: 'To be deleted.',
        unlockDate: new Date('2025-08-01T00:00:00.000Z'),
        sealedAt: new Date(),
        isOpened: true,
      });

      // Delete capsule via DELETE handler
      const reqDelete = new Request(`http://localhost:3000/api/capsules/${capsule._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resDelete = await deleteCapsuleHandler(reqDelete, {
        params: Promise.resolve({ id: capsule._id.toString() }),
      });
      expect(resDelete.status).toBe(200);

      // Verify no longer on timeline
      const reqTimeline = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resTimeline = await getTimelineHandler(reqTimeline);
      const jsonTimeline = await resTimeline.json();
      expect(jsonTimeline.data).toHaveLength(0);
    });

    it('should not return deleted photos as valid attachments on timeline entries', async () => {
      const photo = await Photo.create({
        userId: userAId,
        url: 'https://res.cloudinary.com/test-cloud/image/authenticated/memory_photo.jpg',
        publicId: 'echoes/memory_photo_pub_id',
        format: 'jpg',
        width: 1920,
        height: 1080,
        bytes: 102400,
      });

      await Memory.create({
        userId: userAId,
        title: 'Memory with Photo',
        content: 'Testing photo deletion.',
        memoryDate: new Date('2025-09-01T00:00:00.000Z'),
        photos: [photo._id],
      });

      // Verify photo present initially
      const req1 = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res1 = await getTimelineHandler(req1);
      const json1 = await res1.json();
      expect(json1.data[0].photos).toHaveLength(1);

      // Delete the photo document directly from Photo collection
      await Photo.deleteOne({ _id: photo._id });

      // Query timeline again: deleted photo must be omitted from attachments
      const req2 = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res2 = await getTimelineHandler(req2);
      const json2 = await res2.json();
      expect(json2.data[0].photos).toEqual([]);
    });

    it('should preserve shared photo references across other entries when one resource is deleted', async () => {
      const sharedPhoto = await Photo.create({
        userId: userAId,
        url: 'https://res.cloudinary.com/test-cloud/image/authenticated/shared_asset.jpg',
        publicId: 'echoes/shared_asset_pub_id',
        format: 'jpg',
        width: 1920,
        height: 1080,
        bytes: 102400,
      });

      // Memory references the photo
      await Memory.create({
        userId: userAId,
        title: 'Memory Keeping Shared Photo',
        content: 'This memory keeps the shared photo.',
        memoryDate: new Date('2025-04-01T00:00:00.000Z'),
        photos: [sharedPhoto._id],
      });

      // Capsule also references the same photo
      const capsule = await TimeCapsule.create({
        userId: userAId,
        title: 'Capsule to be Deleted',
        message: 'This capsule will be deleted.',
        unlockDate: new Date('2025-04-15T00:00:00.000Z'),
        sealedAt: new Date(),
        isOpened: true,
        photos: [sharedPhoto._id],
      });

      // Delete the capsule
      const reqDelete = new Request(`http://localhost:3000/api/capsules/${capsule._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resDelete = await deleteCapsuleHandler(reqDelete, {
        params: Promise.resolve({ id: capsule._id.toString() }),
      });
      expect(resDelete.status).toBe(200);

      // Verify timeline: memory remains intact with valid photo signed URL
      const reqTimeline = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resTimeline = await getTimelineHandler(reqTimeline);
      const jsonTimeline = await resTimeline.json();

      expect(jsonTimeline.data).toHaveLength(1);
      expect(jsonTimeline.data[0].title).toBe('Memory Keeping Shared Photo');
      expect(jsonTimeline.data[0].photos).toHaveLength(1);
      expect(jsonTimeline.data[0].photos[0].id).toBe(sharedPhoto._id.toString());
    });
  });

  // ==========================================
  // 7. Audit: Empty-Collection Aggregation Scenarios
  // ==========================================
  describe('Audit: Empty-Collection Aggregation Scenarios', () => {
    it('Scenario 1: should return memories correctly when memories exist but capsules do not', async () => {
      await Memory.create({
        userId: userAId,
        title: 'Solo Memory',
        content: 'Only memories exist in this account.',
        memoryDate: new Date('2025-03-01T00:00:00.000Z'),
      });

      const req = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res = await getTimelineHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].type).toBe('memory');
      expect(json.data[0].title).toBe('Solo Memory');
      expect(json.pagination.total).toBe(1);
    });

    it('Scenario 2: should return capsules correctly when capsules exist but memories do not', async () => {
      await TimeCapsule.create({
        userId: userAId,
        title: 'Solo Capsule',
        message: 'Only capsules exist in this account.',
        unlockDate: new Date('2027-01-01T00:00:00.000Z'),
        sealedAt: new Date(),
        isOpened: false,
      });

      const req = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res = await getTimelineHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].type).toBe('capsule');
      expect(json.data[0].title).toBe('Solo Capsule');
      expect(json.pagination.total).toBe(1);
    });

    it('Scenario 3: should return both when both memories and capsules exist', async () => {
      await Memory.create({
        userId: userAId,
        title: 'Dual Memory',
        content: 'Memory in dual test.',
        memoryDate: new Date('2025-01-01T00:00:00.000Z'),
      });
      await TimeCapsule.create({
        userId: userAId,
        title: 'Dual Capsule',
        message: 'Capsule in dual test.',
        unlockDate: new Date('2026-01-01T00:00:00.000Z'),
        sealedAt: new Date(),
        isOpened: false,
      });

      const req = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res = await getTimelineHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toHaveLength(2);
      expect(json.pagination.total).toBe(2);
      expect(json.data.map((d: { type: string }) => d.type)).toEqual(['memory', 'capsule']);
    });

    it('Scenario 4: should return empty array when both collections are empty', async () => {
      const req = new Request('http://localhost:3000/api/timeline', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res = await getTimelineHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual([]);
      expect(json.pagination.total).toBe(0);
    });
  });

  // ==========================================
  // 8. Audit: Cursor Pagination & Concurrent Inserts
  // ==========================================
  describe('Audit: Cursor Pagination & Concurrency Invariants', () => {
    it('should traverse mixed memories and capsules deterministically across pages using nextCursor', async () => {
      // Create 3 memories and 2 capsules alternating dates
      await Memory.create({
        userId: userAId,
        title: 'Item 1 - Mem',
        content: 'C1',
        memoryDate: new Date('2025-01-01T00:00:00.000Z'),
      });
      await TimeCapsule.create({
        userId: userAId,
        title: 'Item 2 - Cap',
        message: 'C2',
        unlockDate: new Date('2025-02-01T00:00:00.000Z'),
        sealedAt: new Date(),
        isOpened: true,
      });
      await Memory.create({
        userId: userAId,
        title: 'Item 3 - Mem',
        content: 'C3',
        memoryDate: new Date('2025-03-01T00:00:00.000Z'),
      });
      await TimeCapsule.create({
        userId: userAId,
        title: 'Item 4 - Cap',
        message: 'C4',
        unlockDate: new Date('2025-04-01T00:00:00.000Z'),
        sealedAt: new Date(),
        isOpened: true,
      });

      // Page 1 with limit 2
      const req1 = new Request('http://localhost:3000/api/timeline?limit=2', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res1 = await getTimelineHandler(req1);
      const json1 = await res1.json();
      expect(json1.data.map((i: { title: string }) => i.title)).toEqual([
        'Item 1 - Mem',
        'Item 2 - Cap',
      ]);
      const cursor1 = json1.pagination.nextCursor;

      // Page 2 with cursor1
      const req2 = new Request(`http://localhost:3000/api/timeline?cursor=${cursor1}&limit=2`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res2 = await getTimelineHandler(req2);
      const json2 = await res2.json();
      expect(json2.data.map((i: { title: string }) => i.title)).toEqual([
        'Item 3 - Mem',
        'Item 4 - Cap',
      ]);
      expect(json2.pagination.hasNextPage).toBe(false);
      expect(json2.pagination.nextCursor).toBeNull();
    });

    it('should not duplicate or shift items when a concurrent insert occurs with a date prior to the cursor', async () => {
      // 2 existing memories
      await Memory.create({
        userId: userAId,
        title: 'Batch A',
        content: 'Content A',
        memoryDate: new Date('2025-02-01T00:00:00.000Z'),
      });
      await Memory.create({
        userId: userAId,
        title: 'Batch B',
        content: 'Content B',
        memoryDate: new Date('2025-04-01T00:00:00.000Z'),
      });

      // Fetch first page (Batch A)
      const req1 = new Request('http://localhost:3000/api/timeline?limit=1', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res1 = await getTimelineHandler(req1);
      const json1 = await res1.json();
      expect(json1.data[0].title).toBe('Batch A');
      const cursor = json1.pagination.nextCursor;

      // Concurrent insert with an earlier date (2025-01-01)
      await Memory.create({
        userId: userAId,
        title: 'Prior Insert (Concurrent)',
        content: 'Should not affect forward cursor seek',
        memoryDate: new Date('2025-01-01T00:00:00.000Z'),
      });

      // Fetch page 2 using cursor
      const req2 = new Request(`http://localhost:3000/api/timeline?cursor=${cursor}&limit=1`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res2 = await getTimelineHandler(req2);
      const json2 = await res2.json();

      // Crucial: Cursor boundary isolates pagination from prior inserts
      expect(json2.data).toHaveLength(1);
      expect(json2.data[0].title).toBe('Batch B');
    });

    it('should strictly preserve locked capsule privacy under cursor-based pagination', async () => {
      await TimeCapsule.create({
        userId: userAId,
        title: 'Locked in Cursor Page',
        message: 'CONFIDENTIAL LETTER',
        unlockDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        sealedAt: new Date(),
        isOpened: false,
      });

      const req = new Request('http://localhost:3000/api/timeline?limit=1', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const res = await getTimelineHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      const item = json.data[0];
      expect(item.isLocked).toBe(true);
      expect(item.content).toBeUndefined();
      expect(item.message).toBeUndefined();
      expect(item.photos).toBeUndefined();
      expect(JSON.stringify(json)).not.toContain('CONFIDENTIAL LETTER');
    });
  });
});

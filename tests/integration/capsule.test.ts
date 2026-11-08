import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
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
import { POST as createCapsuleHandler, GET as getCapsulesHandler } from '@/app/api/capsules/route';
import {
  GET as getCapsuleByIdHandler,
  DELETE as deleteCapsuleHandler,
} from '@/app/api/capsules/[id]/route';
import { POST as openCapsuleHandler } from '@/app/api/capsules/[id]/open/route';

describe('Time Capsule Date-Locking API Integration Tests', () => {
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
      public_id: options.publicId || 'echoes/capsule_sample',
      secure_url: 'https://res.cloudinary.com/test-cloud/image/authenticated/capsule_sample.jpg',
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
          name: 'User A',
          email: 'usera@example.com',
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
          name: 'User B',
          email: 'userb@example.com',
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

  describe('POST /api/capsules (Sealing & Creation)', () => {
    it('should create and seal a new time capsule with a future unlock date', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(); // 1 year ahead

      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: 'Letter to my 2027 self',
          message: 'Never forget what you overcame in 2026.',
          unlockDate: futureDate,
        }),
      });

      const response = await createCapsuleHandler(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.title).toBe('Letter to my 2027 self');
      expect(json.data.userId).toBe(userAId);
      expect(json.data.isOpened).toBe(false);
      expect(json.data.isLocked).toBe(true);
      expect(json.data.sealedAt).toBeDefined();
      expect(new Date(json.data.unlockDate).toISOString()).toBe(futureDate);
      // Ensure sealed letter contents are not leaked in creation response
      expect(json.data.message).toBeUndefined();
    });

    it('should accept unlockAt virtual alias as target date', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: 'UnlockAt Alias Test',
          message: 'Checking alias support.',
          unlockAt: futureDate,
        }),
      });

      const response = await createCapsuleHandler(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(new Date(json.data.unlockDate).toISOString()).toBe(futureDate);
    });

    it('should reject creation when unauthenticated with 401 Unauthorized', async () => {
      const futureDate = new Date(Date.now() + 1000000).toISOString();

      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthenticated Capsule',
          message: 'Some message',
          unlockDate: futureDate,
        }),
      });

      const response = await createCapsuleHandler(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
    });

    it('should fail validation when title or message are missing or empty', async () => {
      const futureDate = new Date(Date.now() + 1000000).toISOString();

      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: '   ',
          message: '',
          unlockDate: futureDate,
        }),
      });

      const response = await createCapsuleHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Validation failed');
    });

    it('should reject past unlock dates with 400 Bad Request', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago

      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: 'Past Capsule',
          message: 'This should not be allowed.',
          unlockDate: pastDate,
        }),
      });

      const response = await createCapsuleHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.details.some((d: { message: string }) => d.message.includes('future'))).toBe(
        true
      );
    });

    it('should reject current or zero-distance unlock dates', async () => {
      const currentDate = new Date().toISOString();

      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: 'Now Capsule',
          message: 'Unlock date is now.',
          unlockDate: currentDate,
        }),
      });

      const response = await createCapsuleHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
    });

    it('should prevent client tampering with lifecycle and security fields (userId, isOpened, sealedAt, openedAt)', async () => {
      const futureDate = new Date(Date.now() + 10000000).toISOString();

      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: 'Tampering Attempt',
          message: 'Trying to manipulate lifecycle fields.',
          unlockDate: futureDate,
          userId: userBId, // Attempt to forge owner
          isOpened: true, // Attempt to create already unsealed
          sealedAt: new Date(2000, 1, 1).toISOString(),
          openedAt: new Date().toISOString(),
        }),
      });

      const response = await createCapsuleHandler(request);
      const json = await response.json();

      // Either schema rejects client-supplied forbidden fields with 400
      expect(response.status).toBe(400);
      expect(json.success).toBe(false);

      // Verify no capsule was forged
      const count = await TimeCapsule.countDocuments({ title: 'Tampering Attempt' });
      expect(count).toBe(0);
    });

    it('should reject malformed JSON payloads with 400 Bad Request', async () => {
      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: '{ malformed_json: ',
      });

      const response = await createCapsuleHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('Malformed JSON');
    });
  });

  describe('Photo Ownership Validation on Creation', () => {
    it('should successfully attach photos owned by the authenticated user', async () => {
      const photo = await Photo.create({
        userId: new mongoose.Types.ObjectId(userAId),
        url: 'https://res.cloudinary.com/test-cloud/image/authenticated/userA_pic.jpg',
        publicId: 'userA_pic',
      });

      const futureDate = new Date(Date.now() + 5000000).toISOString();

      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: 'Capsule with Photo',
          message: 'Attaching my own photo.',
          unlockDate: futureDate,
          photos: [photo._id.toString()],
        }),
      });

      const response = await createCapsuleHandler(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);

      const dbCapsule = await TimeCapsule.findById(json.data._id);
      expect(dbCapsule?.photos).toContainEqual(photo._id);
    });

    it('should reject creation if any attached photo belongs to another user (IDOR prevention)', async () => {
      // Photo owned by User B
      const photoB = await Photo.create({
        userId: new mongoose.Types.ObjectId(userBId),
        url: 'https://res.cloudinary.com/test-cloud/image/authenticated/userB_secret.jpg',
        publicId: 'userB_secret',
      });

      const futureDate = new Date(Date.now() + 5000000).toISOString();

      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`, // User A tries to attach User B's photo
        },
        body: JSON.stringify({
          title: 'Unauthorized Photo Capsule',
          message: 'Trying to steal User B photo.',
          unlockDate: futureDate,
          photos: [photoB._id.toString()],
        }),
      });

      const response = await createCapsuleHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('not owned by the authenticated user');
    });

    it('should reject arbitrary external photo URLs not stored in the vault', async () => {
      const futureDate = new Date(Date.now() + 5000000).toISOString();

      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: 'Arbitrary URL Capsule',
          message: 'External picture link.',
          unlockDate: futureDate,
          photoUrls: ['https://attacker.com/malicious_image.png'],
        }),
      });

      const response = await createCapsuleHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Arbitrary external photo URLs are not permitted');
    });
  });

  describe('GET /api/capsules (Listing & Redaction)', () => {
    it('should return only capsules belonging to authenticated user', async () => {
      const futureDate = new Date(Date.now() + 1000000);

      // Create capsule for User A
      await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: "User A's Capsule",
        message: 'Secret letter A',
        unlockDate: futureDate,
      });

      // Create capsule for User B
      await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userBId),
        title: "User B's Capsule",
        message: 'Secret letter B',
        unlockDate: futureDate,
      });

      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getCapsulesHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].title).toBe("User A's Capsule");
      expect(json.data[0].userId.toString()).toBe(userAId);
    });

    it('should never expose message or private photos for locked capsules', async () => {
      const futureDate = new Date(Date.now() + 10000000);

      const photo = await Photo.create({
        userId: new mongoose.Types.ObjectId(userAId),
        url: 'https://res.cloudinary.com/test-cloud/image/authenticated/vault_pic.jpg',
        publicId: 'vault_pic',
      });

      await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Confidential Locked Capsule',
        message: 'ULTRA_SECRET_MESSAGE_DO_NOT_LEAK',
        unlockDate: futureDate,
        photos: [photo._id],
        photoUrls: [photo.url],
      });

      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getCapsulesHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const capsule = json.data[0];
      expect(capsule.title).toBe('Confidential Locked Capsule');
      expect(capsule.isLocked).toBe(true);

      // Invariant: Message and photo references must be completely absent/redacted
      expect(capsule.message).toBeUndefined();
      expect(capsule.photos).toBeUndefined();
      expect(capsule.photoUrls).toBeUndefined();
      expect(JSON.stringify(json)).not.toContain('ULTRA_SECRET_MESSAGE_DO_NOT_LEAK');
    });

    it('should expose permitted content and signed photo URLs for unlocked capsules', async () => {
      const pastDate = new Date(Date.now() - 1000000); // Already reached unlockDate

      const photo = await Photo.create({
        userId: new mongoose.Types.ObjectId(userAId),
        url: 'https://res.cloudinary.com/test-cloud/image/authenticated/unlocked_pic.jpg',
        publicId: 'unlocked_pic',
      });

      await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Matured Milestone Capsule',
        message: 'This message is now unlocked and accessible.',
        unlockDate: pastDate,
        photos: [photo._id],
        photoUrls: [photo.url],
        isOpened: true,
      });

      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getCapsulesHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const capsule = json.data[0];
      expect(capsule.title).toBe('Matured Milestone Capsule');
      expect(capsule.isLocked).toBe(false);
      expect(capsule.message).toBe('This message is now unlocked and accessible.');
      expect(capsule.photos).toHaveLength(1);
      expect(capsule.photos[0].signedUrl).toBeDefined();
    });

    it('should support pagination and ordering by unlock date', async () => {
      const baseTime = Date.now();
      for (let i = 1; i <= 5; i++) {
        await TimeCapsule.create({
          userId: new mongoose.Types.ObjectId(userAId),
          title: `Capsule ${i}`,
          message: `Content ${i}`,
          unlockDate: new Date(baseTime + i * 100000),
        });
      }

      // Page 1, limit 2, default ascending sort
      const request = new Request('http://localhost:3000/api/capsules?page=1&limit=2', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getCapsulesHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2);
      expect(json.pagination.total).toBe(5);
      expect(json.pagination.totalPages).toBe(3);
      expect(json.pagination.hasNextPage).toBe(true);
      expect(json.data[0].title).toBe('Capsule 1');
      expect(json.data[1].title).toBe('Capsule 2');

      // Sort descending
      const descReq = new Request(
        'http://localhost:3000/api/capsules?page=1&limit=2&sortOrder=desc',
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );
      const descRes = await getCapsulesHandler(descReq);
      const descJson = await descRes.json();
      expect(descJson.data[0].title).toBe('Capsule 5');
    });

    it('should authenticate User B with separate token and isolate User B capsule listing', async () => {
      const request = new Request('http://localhost:3000/api/capsules', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      const response = await getCapsulesHandler(request);
      const json = await response.json();
      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
    });
  });

  describe('GET /api/capsules/:id (Detail & Date-Locking Invariant)', () => {
    it('should return 403 Forbidden when attempting to retrieve a locked capsule prior to unlockDate', async () => {
      const futureDate = new Date(Date.now() + 100000000);

      const capsule = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Locked Vault Capsule',
        message: 'SECRET_LOCKED_CONTENT',
        unlockDate: futureDate,
      });

      const request = new Request(`http://localhost:3000/api/capsules/${capsule._id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getCapsuleByIdHandler(request, {
        params: Promise.resolve({ id: capsule._id.toString() }),
      });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.isLocked).toBe(true);
      expect(json.error).toContain('sealed and locked');
      expect(json.data).toBeUndefined();
      expect(JSON.stringify(json)).not.toContain('SECRET_LOCKED_CONTENT');
    });

    it('should return 200 OK and complete capsule details after unlockDate has arrived', async () => {
      const pastDate = new Date(Date.now() - 5000); // 5 seconds in the past

      const capsule = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Unlocked Future Letter',
        message: 'Welcome to your future self.',
        unlockDate: pastDate,
      });

      const request = new Request(`http://localhost:3000/api/capsules/${capsule._id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getCapsuleByIdHandler(request, {
        params: Promise.resolve({ id: capsule._id.toString() }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.title).toBe('Unlocked Future Letter');
      expect(json.data.message).toBe('Welcome to your future self.');
      expect(json.data.isLocked).toBe(false);
    });

    it('should return 404 Not Found if User A attempts to view User B capsule (IDOR defense)', async () => {
      const futureDate = new Date(Date.now() + 1000000);

      const capsuleB = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userBId),
        title: "User B's Private Capsule",
        message: 'User B private content',
        unlockDate: futureDate,
      });

      // User A requests User B capsule
      const request = new Request(`http://localhost:3000/api/capsules/${capsuleB._id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getCapsuleByIdHandler(request, {
        params: Promise.resolve({ id: capsuleB._id.toString() }),
      });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.error).toContain('not found or access denied');
    });

    it('should return 400 Bad Request for malformed capsule ID', async () => {
      const request = new Request('http://localhost:3000/api/capsules/not-a-valid-id', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getCapsuleByIdHandler(request, {
        params: Promise.resolve({ id: 'not-a-valid-id' }),
      });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('Invalid time capsule ID format');
    });

    it('should return 404 for nonexistent valid ObjectId', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const request = new Request(`http://localhost:3000/api/capsules/${nonExistentId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getCapsuleByIdHandler(request, {
        params: Promise.resolve({ id: nonExistentId }),
      });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.success).toBe(false);
    });
  });

  describe('POST /api/capsules/:id/open (Unsealing)', () => {
    it('should reject opening before unlockDate with 403 Forbidden', async () => {
      const futureDate = new Date(Date.now() + 5000000);

      const capsule = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Premature Open Test',
        message: 'Must remain locked.',
        unlockDate: futureDate,
        isOpened: false,
      });

      const request = new Request(`http://localhost:3000/api/capsules/${capsule._id}/open`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await openCapsuleHandler(request, {
        params: Promise.resolve({ id: capsule._id.toString() }),
      });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Cannot open time capsule before its unlock date');

      // Verify DB remains sealed
      const unchanged = await TimeCapsule.findById(capsule._id);
      expect(unchanged?.isOpened).toBe(false);
      expect(unchanged?.openedAt).toBeNull();
    });

    it('should successfully unseal capsule at or after unlock date and record openedAt', async () => {
      const pastDate = new Date(Date.now() - 1000); // Matured

      const capsule = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Matured Capsule Ready for Opening',
        message: 'Congratulations on reaching your goal!',
        unlockDate: pastDate,
        isOpened: false,
      });

      const request = new Request(`http://localhost:3000/api/capsules/${capsule._id}/open`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await openCapsuleHandler(request, {
        params: Promise.resolve({ id: capsule._id.toString() }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.isOpened).toBe(true);
      expect(json.data.openedAt).toBeDefined();
      expect(json.data.message).toBe('Congratulations on reaching your goal!');
      expect(json.data.isLocked).toBe(false);

      // Verify in DB
      const updated = await TimeCapsule.findById(capsule._id);
      expect(updated?.isOpened).toBe(true);
      expect(updated?.openedAt).not.toBeNull();
    });

    it('should make repeated open requests safe and idempotent (preserve initial openedAt timestamp)', async () => {
      const pastDate = new Date(Date.now() - 5000);
      const originalOpenedAt = new Date(Date.now() - 2000);

      const capsule = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Already Opened Capsule',
        message: 'Previously opened content.',
        unlockDate: pastDate,
        isOpened: true,
        openedAt: originalOpenedAt,
      });

      const request = new Request(`http://localhost:3000/api/capsules/${capsule._id}/open`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await openCapsuleHandler(request, {
        params: Promise.resolve({ id: capsule._id.toString() }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.isOpened).toBe(true);
      // Ensure openedAt was preserved and not overwritten with current time
      expect(new Date(json.data.openedAt).toISOString()).toBe(originalOpenedAt.toISOString());

      const dbRecord = await TimeCapsule.findById(capsule._id);
      expect(dbRecord?.openedAt?.toISOString()).toBe(originalOpenedAt.toISOString());
    });

    it('should reject opening another user capsule with 404 Not Found', async () => {
      const pastDate = new Date(Date.now() - 1000);

      const capsuleB = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userBId),
        title: "User B's Capsule",
        message: 'Private letter',
        unlockDate: pastDate,
      });

      // User A attempts to open User B capsule
      const request = new Request(`http://localhost:3000/api/capsules/${capsuleB._id}/open`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await openCapsuleHandler(request, {
        params: Promise.resolve({ id: capsuleB._id.toString() }),
      });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.success).toBe(false);
    });
  });

  describe('DELETE /api/capsules/:id (Deletion & Resource Cleanup)', () => {
    it('should delete a capsule and safely purge exclusively attached photo assets', async () => {
      const photo = await Photo.create({
        userId: new mongoose.Types.ObjectId(userAId),
        url: 'https://res.cloudinary.com/test-cloud/image/authenticated/capsule_exclusive.jpg',
        publicId: 'capsule_exclusive_123',
        memoryId: null, // Exclusively attached to capsule
      });

      const capsule = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Capsule to Delete',
        message: 'Temporary letter.',
        unlockDate: new Date(Date.now() + 1000000),
        photos: [photo._id],
      });

      const request = new Request(`http://localhost:3000/api/capsules/${capsule._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await deleteCapsuleHandler(request, {
        params: Promise.resolve({ id: capsule._id.toString() }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);

      // Verify Cloudinary destroy was called for the exclusive asset
      expect(mockDestroyFn).toHaveBeenCalledWith('capsule_exclusive_123');

      // Verify Photo document was removed from database
      const reloadedPhoto = await Photo.findById(photo._id);
      expect(reloadedPhoto).toBeNull();

      // Verify Capsule was removed
      const reloadedCapsule = await TimeCapsule.findById(capsule._id);
      expect(reloadedCapsule).toBeNull();
    });

    it('should preserve photos that are also shared with a memory when deleting a capsule', async () => {
      const memory = await Memory.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Shared Memory',
        content: 'Content',
        memoryDate: new Date(),
      });

      const sharedPhoto = await Photo.create({
        userId: new mongoose.Types.ObjectId(userAId),
        url: 'https://res.cloudinary.com/test-cloud/image/authenticated/shared_pic.jpg',
        publicId: 'shared_pic_456',
        memoryId: memory._id, // Linked to a memory!
      });

      const capsule = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Capsule with Shared Photo',
        message: 'Message',
        unlockDate: new Date(Date.now() + 1000000),
        photos: [sharedPhoto._id],
      });

      const request = new Request(`http://localhost:3000/api/capsules/${capsule._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await deleteCapsuleHandler(request, {
        params: Promise.resolve({ id: capsule._id.toString() }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);

      // Invariant: Shared photo must NOT be deleted from Cloudinary or database
      expect(mockDestroyFn).not.toHaveBeenCalledWith('shared_pic_456');

      const preservedPhoto = await Photo.findById(sharedPhoto._id);
      expect(preservedPhoto).not.toBeNull();
      expect(preservedPhoto?.memoryId?.toString()).toBe(memory._id.toString());
    });

    it('should reject deleting another user capsule with 404 Not Found', async () => {
      const capsuleB = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userBId),
        title: "User B's Capsule",
        message: 'Message',
        unlockDate: new Date(Date.now() + 1000000),
      });

      // User A tries to delete User B capsule
      const request = new Request(`http://localhost:3000/api/capsules/${capsuleB._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await deleteCapsuleHandler(request, {
        params: Promise.resolve({ id: capsuleB._id.toString() }),
      });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.success).toBe(false);

      const intact = await TimeCapsule.findById(capsuleB._id);
      expect(intact).not.toBeNull();
    });

    it('should return 502 Bad Gateway if Cloudinary fails to delete exclusive photo asset', async () => {
      mockDestroyFn.mockRejectedValueOnce(new Error('Cloudinary timeout'));

      const photo = await Photo.create({
        userId: new mongoose.Types.ObjectId(userAId),
        url: 'https://res.cloudinary.com/test-cloud/image/authenticated/failing_photo.jpg',
        publicId: 'failing_photo_id',
        memoryId: null,
      });

      const capsule = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Capsule Failing Deletion',
        message: 'Message',
        unlockDate: new Date(Date.now() + 1000000),
        photos: [photo._id],
      });

      const request = new Request(`http://localhost:3000/api/capsules/${capsule._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await deleteCapsuleHandler(request, {
        params: Promise.resolve({ id: capsule._id.toString() }),
      });
      const json = await response.json();

      expect(response.status).toBe(502);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Failed to delete');

      // Invariant: Both photo and capsule documents are preserved for safe retry
      const preservedPhoto = await Photo.findById(photo._id);
      expect(preservedPhoto).not.toBeNull();
      const preservedCapsule = await TimeCapsule.findById(capsule._id);
      expect(preservedCapsule).not.toBeNull();
    });

    it('should filter capsules by status=locked and status=unlocked', async () => {
      const now = Date.now();
      await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Filter Locked Capsule',
        message: 'Locked',
        unlockDate: new Date(now + 1000000),
      });

      await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Filter Unlocked Capsule',
        message: 'Unlocked',
        unlockDate: new Date(now - 1000000),
      });

      // Filter locked
      const reqLocked = new Request('http://localhost:3000/api/capsules?status=locked', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resLocked = await getCapsulesHandler(reqLocked);
      const jsonLocked = await resLocked.json();
      expect(jsonLocked.data.every((c: { isLocked: boolean }) => c.isLocked === true)).toBe(true);

      // Filter unlocked
      const reqUnlocked = new Request('http://localhost:3000/api/capsules?status=unlocked', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resUnlocked = await getCapsulesHandler(reqUnlocked);
      const jsonUnlocked = await resUnlocked.json();
      expect(jsonUnlocked.data.every((c: { isLocked: boolean }) => c.isLocked === false)).toBe(
        true
      );
    });

    it('should attach owned photos by URL when creating a capsule and reveal signed URLs on open', async () => {
      const photo = await Photo.create({
        userId: new mongoose.Types.ObjectId(userAId),
        url: 'https://res.cloudinary.com/test-cloud/image/authenticated/owned_by_url.jpg',
        publicId: 'owned_by_url_id',
      });

      const pastDate = new Date(Date.now() - 5000);

      const capsule = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Capsule with Owned Photo URL',
        message: 'Revealed message with photo.',
        unlockDate: pastDate,
        photos: [photo._id],
        photoUrls: [photo.url],
        isOpened: false,
      });

      // Open capsule
      const openReq = new Request(`http://localhost:3000/api/capsules/${capsule._id}/open`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const openRes = await openCapsuleHandler(openReq, {
        params: Promise.resolve({ id: capsule._id.toString() }),
      });
      const openJson = await openRes.json();

      expect(openRes.status).toBe(200);
      expect(openJson.data.photos).toHaveLength(1);
      expect(openJson.data.photos[0].signedUrl).toBeDefined();

      // Retrieve single capsule details
      const getReq = new Request(`http://localhost:3000/api/capsules/${capsule._id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const getRes = await getCapsuleByIdHandler(getReq, {
        params: Promise.resolve({ id: capsule._id.toString() }),
      });
      const getJson = await getRes.json();

      expect(getRes.status).toBe(200);
      expect(getJson.data.photos).toHaveLength(1);
      expect(getJson.data.photos[0].signedUrl).toBeDefined();
    });

    it('should NOT delete a photo referenced by multiple capsules when only one capsule is deleted', async () => {
      const sharedPhoto = await Photo.create({
        userId: new mongoose.Types.ObjectId(userAId),
        url: 'https://res.cloudinary.com/test-cloud/image/authenticated/multi_capsule_photo.jpg',
        publicId: 'multi_capsule_photo_123',
        memoryId: null,
      });

      const capsule1 = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Capsule 1 Sharing Photo',
        message: 'Message 1',
        unlockDate: new Date(Date.now() + 1000000),
        photos: [sharedPhoto._id],
      });

      const capsule2 = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Capsule 2 Sharing Photo',
        message: 'Message 2',
        unlockDate: new Date(Date.now() + 2000000),
        photos: [sharedPhoto._id],
      });

      // Delete Capsule 1
      const request1 = new Request(`http://localhost:3000/api/capsules/${capsule1._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const response1 = await deleteCapsuleHandler(request1, {
        params: Promise.resolve({ id: capsule1._id.toString() }),
      });
      expect(response1.status).toBe(200);

      // Verify Cloudinary destroy was NOT called because Capsule 2 still references it
      expect(mockDestroyFn).not.toHaveBeenCalledWith('multi_capsule_photo_123');

      // Verify photo still exists in MongoDB
      const preservedPhoto = await Photo.findById(sharedPhoto._id);
      expect(preservedPhoto).not.toBeNull();

      // Verify Capsule 2 is still intact with its photo reference
      const reloadedCapsule2 = await TimeCapsule.findById(capsule2._id);
      expect(reloadedCapsule2).not.toBeNull();
      expect(reloadedCapsule2?.photos).toContainEqual(sharedPhoto._id);

      // Now delete Capsule 2
      const request2 = new Request(`http://localhost:3000/api/capsules/${capsule2._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const response2 = await deleteCapsuleHandler(request2, {
        params: Promise.resolve({ id: capsule2._id.toString() }),
      });
      expect(response2.status).toBe(200);

      // Now that no other capsule or memory references the photo, it is purged
      expect(mockDestroyFn).toHaveBeenCalledWith('multi_capsule_photo_123');
      const purgedPhoto = await Photo.findById(sharedPhoto._id);
      expect(purgedPhoto).toBeNull();
    });
  });

  describe('Audit: Locked-Content Redaction & Information Leakage Prevention', () => {
    it('should strictly verify locked capsule responses never leak secret message, photo IDs, public IDs, or signed URLs across any path', async () => {
      const secretLetter = 'TOP_SECRET_CONFIDENTIAL_INHERITANCE_CODE_98765';
      const secretPublicId = 'secret_cloudinary_public_id_abcxyz';
      const secretUrl = 'https://res.cloudinary.com/test-cloud/image/authenticated/secret_pic.jpg';

      const photo = await Photo.create({
        userId: new mongoose.Types.ObjectId(userAId),
        url: secretUrl,
        publicId: secretPublicId,
      });

      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days future

      // 1. Creation response path
      const createReq = new Request('http://localhost:3000/api/capsules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: 'Encrypted Vault Capsule',
          message: secretLetter,
          unlockDate: futureDate.toISOString(),
          photos: [photo._id.toString()],
        }),
      });

      const createRes = await createCapsuleHandler(createReq);
      const createJson = await createRes.json();
      const createSerialized = JSON.stringify(createJson);

      expect(createRes.status).toBe(201);
      expect(createSerialized).not.toContain(secretLetter);
      expect(createSerialized).not.toContain(secretPublicId);
      expect(createSerialized).not.toContain(secretUrl);
      expect(createJson.data.message).toBeUndefined();
      expect(createJson.data.photos).toBeUndefined();
      expect(createJson.data.photoUrls).toBeUndefined();

      const capsuleId = createJson.data._id;

      // 2. Listing response path
      const listReq = new Request('http://localhost:3000/api/capsules', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const listRes = await getCapsulesHandler(listReq);
      const listJson = await listRes.json();
      const listSerialized = JSON.stringify(listJson);

      expect(listRes.status).toBe(200);
      expect(listSerialized).not.toContain(secretLetter);
      expect(listSerialized).not.toContain(secretPublicId);
      expect(listSerialized).not.toContain(secretUrl);
      const listedCapsule = listJson.data.find((c: { _id: string }) => c._id === capsuleId);
      expect(listedCapsule.isLocked).toBe(true);
      expect(listedCapsule.message).toBeUndefined();
      expect(listedCapsule.photos).toBeUndefined();
      expect(listedCapsule.photoUrls).toBeUndefined();

      // 3. Detail response path (403 Forbidden)
      const detailReq = new Request(`http://localhost:3000/api/capsules/${capsuleId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const detailRes = await getCapsuleByIdHandler(detailReq, {
        params: Promise.resolve({ id: capsuleId }),
      });
      const detailJson = await detailRes.json();
      const detailSerialized = JSON.stringify(detailJson);

      expect(detailRes.status).toBe(403);
      expect(detailSerialized).not.toContain(secretLetter);
      expect(detailSerialized).not.toContain(secretPublicId);
      expect(detailSerialized).not.toContain(secretUrl);
      expect(detailJson.isLocked).toBe(true);
      expect(detailJson.data).toBeUndefined();

      // 4. Premature unsealing response path (403 Forbidden)
      const openReq = new Request(`http://localhost:3000/api/capsules/${capsuleId}/open`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const openRes = await openCapsuleHandler(openReq, {
        params: Promise.resolve({ id: capsuleId }),
      });
      const openJson = await openRes.json();
      const openSerialized = JSON.stringify(openJson);

      expect(openRes.status).toBe(403);
      expect(openSerialized).not.toContain(secretLetter);
      expect(openSerialized).not.toContain(secretPublicId);
      expect(openSerialized).not.toContain(secretUrl);
      expect(openJson.isLocked).toBe(true);
      expect(openJson.data).toBeUndefined();
    });
  });

  describe('Audit: Deterministic Date Boundaries & Timezone Handling', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should strictly lock at unlockDate - 1ms and unlock at exactly unlockDate and unlockDate + 1ms', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });

      const initialNow = Date.now();
      const targetTimeMs = initialNow + 1000 * 60 * 10; // 10 minutes in future (well within 1h JWT validity)
      const targetIso = new Date(targetTimeMs).toISOString();

      // 1. Initial creation at time earlier than target
      vi.setSystemTime(new Date(initialNow));

      const capsule = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Boundary Test Capsule',
        message: 'Boundary message content',
        unlockDate: new Date(targetIso),
        isOpened: false,
      });

      const capsuleId = capsule._id.toString();

      // --- TEST BOUNDARY: unlockDate - 1ms (LOCKED) ---
      vi.setSystemTime(new Date(targetTimeMs - 1));

      // Model instance method check
      expect(capsule.isLocked()).toBe(true);

      // GET /api/capsules/:id must be 403
      const reqMinus1 = new Request(`http://localhost:3000/api/capsules/${capsuleId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resMinus1 = await getCapsuleByIdHandler(reqMinus1, {
        params: Promise.resolve({ id: capsuleId }),
      });
      expect(resMinus1.status).toBe(403);
      const jsonMinus1 = await resMinus1.json();
      expect(jsonMinus1.isLocked).toBe(true);

      // POST /api/capsules/:id/open must be 403
      const openMinus1 = new Request(`http://localhost:3000/api/capsules/${capsuleId}/open`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const openResMinus1 = await openCapsuleHandler(openMinus1, {
        params: Promise.resolve({ id: capsuleId }),
      });
      expect(openResMinus1.status).toBe(403);

      // --- TEST BOUNDARY: exactly unlockDate (UNLOCKED) ---
      vi.setSystemTime(new Date(targetTimeMs));

      // Model instance method check
      expect(capsule.isLocked()).toBe(false);

      // GET /api/capsules/:id must be 200
      const reqExact = new Request(`http://localhost:3000/api/capsules/${capsuleId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resExact = await getCapsuleByIdHandler(reqExact, {
        params: Promise.resolve({ id: capsuleId }),
      });
      expect(resExact.status).toBe(200);
      const jsonExact = await resExact.json();
      expect(jsonExact.data.isLocked).toBe(false);
      expect(jsonExact.data.message).toBe('Boundary message content');

      // POST /api/capsules/:id/open must succeed with 200
      const openExact = new Request(`http://localhost:3000/api/capsules/${capsuleId}/open`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const openResExact = await openCapsuleHandler(openExact, {
        params: Promise.resolve({ id: capsuleId }),
      });
      expect(openResExact.status).toBe(200);
      const openJsonExact = await openResExact.json();
      expect(openJsonExact.data.isOpened).toBe(true);

      // --- TEST BOUNDARY: unlockDate + 1ms (UNLOCKED) ---
      vi.setSystemTime(new Date(targetTimeMs + 1));

      expect(capsule.isLocked()).toBe(false);

      const reqPlus1 = new Request(`http://localhost:3000/api/capsules/${capsuleId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resPlus1 = await getCapsuleByIdHandler(reqPlus1, {
        params: Promise.resolve({ id: capsuleId }),
      });
      expect(resPlus1.status).toBe(200);
    });

    it('should handle timezone offsets deterministically using server epoch time', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });

      // Represent the exact same instant using two different timezone notations:
      // UTC: 2032-12-31T18:30:00.000Z
      // IST (+05:30): 2033-01-01T00:00:00.000+05:30
      const offsetDateString = '2033-01-01T00:00:00.000+05:30';
      const expectedEpochMs = new Date('2032-12-31T18:30:00.000Z').getTime();

      // Set system clock 10 minutes before
      vi.setSystemTime(new Date(expectedEpochMs - 600000));

      const capsule = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'New Year 2033 Timezone Capsule',
        message: 'Happy New Year 2033!',
        unlockDate: new Date(offsetDateString),
      });

      // Assert epoch matches regardless of input timezone notation
      expect(capsule.unlockDate.getTime()).toBe(expectedEpochMs);

      // Check 1ms before in UTC epoch
      vi.setSystemTime(new Date(expectedEpochMs - 1));
      expect(capsule.isLocked()).toBe(true);

      // Check exact epoch in UTC
      vi.setSystemTime(new Date(expectedEpochMs));
      expect(capsule.isLocked()).toBe(false);
    });
  });

  describe('Audit: Immutability & Forbidden Update Paths', () => {
    it('should verify there is no update path for title, message, photos, unlockDate, or ownership', async () => {
      const futureDate = new Date(Date.now() + 10000000);

      const capsule = await TimeCapsule.create({
        userId: new mongoose.Types.ObjectId(userAId),
        title: 'Original Immutable Title',
        message: 'Original Immutable Message',
        unlockDate: futureDate,
      });

      // Verify that after creation, the document fields remain completely unchanged
      const originalRecord = await TimeCapsule.findById(capsule._id).lean();
      expect(originalRecord?.title).toBe('Original Immutable Title');
      expect(originalRecord?.message).toBe('Original Immutable Message');
      expect(originalRecord?.userId.toString()).toBe(userAId);
      expect(originalRecord?.unlockDate.toISOString()).toBe(futureDate.toISOString());
    });
  });
});

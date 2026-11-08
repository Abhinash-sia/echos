import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectTestDb, closeTestDb, clearTestDb } from '../helpers/db-handler';
import { resetRateLimits } from '@/lib/security/rate-limit';
import { TimeCapsule } from '@/models/TimeCapsule';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { GET as meHandler } from '@/app/api/auth/me/route';
import { PATCH as changePasswordHandler } from '@/app/api/auth/change-password/route';
import { POST as createMemoryHandler, GET as getMemoriesHandler } from '@/app/api/memories/route';
import {
  GET as getMemoryByIdHandler,
  PATCH as updateMemoryHandler,
  DELETE as deleteMemoryHandler,
} from '@/app/api/memories/[id]/route';
import { POST as createCapsuleHandler } from '@/app/api/capsules/route';
import {
  GET as getCapsuleByIdHandler,
  DELETE as deleteCapsuleHandler,
} from '@/app/api/capsules/[id]/route';
import { POST as openCapsuleHandler } from '@/app/api/capsules/[id]/open/route';
import { GET as getTimelineHandler } from '@/app/api/timeline/route';

describe('Stage 8 QA & Complete Integration Verification', () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    resetRateLimits();

    // Register User A
    const resA = await registerHandler(
      new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Archivist Alpha',
          email: 'alpha@echoes.vault',
          password: 'Password123!',
        }),
      })
    );
    const dataA = await resA.json();
    userAToken = dataA.data.token;
    userAId = dataA.data.user._id || dataA.data.user.id;

    // Register User B
    const resB = await registerHandler(
      new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Archivist Beta',
          email: 'beta@echoes.vault',
          password: 'Password123!',
        }),
      })
    );
    const dataB = await resB.json();
    userBToken = dataB.data.token;
  });

  describe('1. Cross-Account Tenant Isolation & Access Control', () => {
    it('prevents User B from reading User A memory', async () => {
      // User A creates memory
      const createRes = await createMemoryHandler(
        new Request('http://localhost:3000/api/memories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            title: 'Alpha Private Reflection',
            content: 'Intimate confidential thoughts.',
            memoryDate: '2026-10-15',
            tags: ['private'],
          }),
        })
      );
      const { data: memA } = await createRes.json();

      // User B tries to read it
      const unauthorizedGet = await getMemoryByIdHandler(
        new Request(`http://localhost:3000/api/memories/${memA._id}`, {
          headers: { Authorization: `Bearer ${userBToken}` },
        }),
        { params: Promise.resolve({ id: memA._id }) }
      );

      expect([403, 404]).toContain(unauthorizedGet.status);
    });

    it('prevents User B from updating or modifying User A memory', async () => {
      const createRes = await createMemoryHandler(
        new Request('http://localhost:3000/api/memories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            title: 'Alpha Memory To Update',
            content: 'Original content.',
            memoryDate: '2026-10-15',
          }),
        })
      );
      const { data: memA } = await createRes.json();

      // User B attempts to tamper with User A's memory
      const tamperRes = await updateMemoryHandler(
        new Request(`http://localhost:3000/api/memories/${memA._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userBToken}`,
          },
          body: JSON.stringify({
            title: 'Hacked by Beta',
          }),
        }),
        { params: Promise.resolve({ id: memA._id }) }
      );

      expect([403, 404]).toContain(tamperRes.status);
    });

    it('prevents User B from deleting User A memory', async () => {
      const createRes = await createMemoryHandler(
        new Request('http://localhost:3000/api/memories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            title: 'Indelible Alpha Memory',
            content: 'Must not be deleted by B.',
            memoryDate: '2026-10-15',
          }),
        })
      );
      const { data: memA } = await createRes.json();

      // User B attempts to delete it
      const deleteRes = await deleteMemoryHandler(
        new Request(`http://localhost:3000/api/memories/${memA._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${userBToken}` },
        }),
        { params: Promise.resolve({ id: memA._id }) }
      );

      expect([403, 404]).toContain(deleteRes.status);

      // Verify memory still exists for User A
      const verifyRes = await getMemoryByIdHandler(
        new Request(`http://localhost:3000/api/memories/${memA._id}`, {
          headers: { Authorization: `Bearer ${userAToken}` },
        }),
        { params: Promise.resolve({ id: memA._id }) }
      );
      expect(verifyRes.status).toBe(200);
    });

    it('prevents User B from accessing or opening User A time capsule', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // User A creates time capsule
      const capRes = await createCapsuleHandler(
        new Request('http://localhost:3000/api/capsules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            title: 'Alpha Secret Future Capsule',
            message: 'Secret future letter.',
            unlockDate: futureDate.toISOString(),
          }),
        })
      );
      const { data: capA } = await capRes.json();

      // User B attempts to view capsule
      const getCapRes = await getCapsuleByIdHandler(
        new Request(`http://localhost:3000/api/capsules/${capA._id}`, {
          headers: { Authorization: `Bearer ${userBToken}` },
        }),
        { params: Promise.resolve({ id: capA._id }) }
      );
      expect([403, 404]).toContain(getCapRes.status);

      // User B attempts to open capsule
      const openCapRes = await openCapsuleHandler(
        new Request(`http://localhost:3000/api/capsules/${capA._id}/open`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userBToken}` },
        }),
        { params: Promise.resolve({ id: capA._id }) }
      );
      expect([403, 404]).toContain(openCapRes.status);

      // User B attempts to delete capsule
      const delCapRes = await deleteCapsuleHandler(
        new Request(`http://localhost:3000/api/capsules/${capA._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${userBToken}` },
        }),
        { params: Promise.resolve({ id: capA._id }) }
      );
      expect([403, 404]).toContain(delCapRes.status);
    });

    it('strictly isolates timeline entries between tenants', async () => {
      // User A creates memory
      await createMemoryHandler(
        new Request('http://localhost:3000/api/memories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            title: 'User A Journey Chapter',
            content: 'Alpha story.',
            memoryDate: '2026-09-01',
          }),
        })
      );

      // User A timeline contains 1 item
      const timelineARes = await getTimelineHandler(
        new Request('http://localhost:3000/api/timeline', {
          headers: { Authorization: `Bearer ${userAToken}` },
        })
      );
      const timelineAData = await timelineARes.json();
      expect(timelineAData.data.length).toBe(1);

      // User B timeline contains 0 items
      const timelineBRes = await getTimelineHandler(
        new Request('http://localhost:3000/api/timeline', {
          headers: { Authorization: `Bearer ${userBToken}` },
        })
      );
      const timelineBData = await timelineBRes.json();
      expect(timelineBData.data.length).toBe(0);
    });
  });

  describe('2. Inviolable Server-Enforced Temporal Privacy', () => {
    it('strictly redacts locked capsule message and photos even for the owner', async () => {
      const futureUnlock = new Date();
      futureUnlock.setDate(futureUnlock.getDate() + 45);

      const capRes = await createCapsuleHandler(
        new Request('http://localhost:3000/api/capsules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            title: 'Sealed Letter to 2027',
            message: 'Highly sensitive future letter that MUST NOT LEAK before unlockDate.',
            unlockDate: futureUnlock.toISOString(),
          }),
        })
      );
      const { data: createdCap } = await capRes.json();

      // Read back locked capsule
      const getRes = await getCapsuleByIdHandler(
        new Request(`http://localhost:3000/api/capsules/${createdCap._id}`, {
          headers: { Authorization: `Bearer ${userAToken}` },
        }),
        { params: Promise.resolve({ id: createdCap._id }) }
      );

      // Inviolable server temporal restriction: returns 403 Forbidden with isLocked: true and redacted content
      expect(getRes.status).toBe(403);
      const fetchedCap = await getRes.json();

      expect(fetchedCap.isLocked).toBe(true);
      expect(fetchedCap.message).toBeUndefined();
      expect(fetchedCap.photos).toBeUndefined();
    });

    it('rejects premature unsealing with HTTP 403 Forbidden', async () => {
      const futureUnlock = new Date();
      futureUnlock.setFullYear(futureUnlock.getFullYear() + 5);

      const capRes = await createCapsuleHandler(
        new Request('http://localhost:3000/api/capsules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            title: 'Five Year Capsule',
            message: 'Future letter.',
            unlockDate: futureUnlock.toISOString(),
          }),
        })
      );
      const { data: createdCap } = await capRes.json();

      // Owner attempts to break seal prematurely
      const openRes = await openCapsuleHandler(
        new Request(`http://localhost:3000/api/capsules/${createdCap._id}/open`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userAToken}` },
        }),
        { params: Promise.resolve({ id: createdCap._id }) }
      );

      expect(openRes.status).toBe(403);
      const errData = await openRes.json();
      expect(errData.success).toBe(false);
      expect(errData.error).toBeDefined();
    });

    it('permits unsealing when authoritative server time reaches unlock milestone', async () => {
      const pastUnlock = new Date(Date.now() - 3600000); // 1 hour ago

      // Create matured capsule in MongoDB directly with unlockDate in the past
      const matureCap = await TimeCapsule.create({
        userId: userAId,
        title: 'Matured Capsule Ready for Reading',
        message: 'Hello future self, the time has come.',
        unlockDate: pastUnlock,
        sealedAt: new Date(Date.now() - 7 * 86400000),
        isOpened: false,
      });

      // Owner opens matured capsule
      const openRes = await openCapsuleHandler(
        new Request(`http://localhost:3000/api/capsules/${matureCap._id}/open`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userAToken}` },
        }),
        { params: Promise.resolve({ id: matureCap._id.toString() }) }
      );

      expect(openRes.status).toBe(200);
      const { data: openedCap } = await openRes.json();
      expect(openedCap.isOpened).toBe(true);
      expect(openedCap.openedAt).toBeDefined();
      expect(openedCap.message).toBe('Hello future self, the time has come.');
    });
  });

  describe('3. Session Revocation & Password Lifecycle', () => {
    it('revokes session token upon password change via tokenVersion increment', async () => {
      // 1. Verify User A current token works
      const initialMe = await meHandler(
        new Request('http://localhost:3000/api/auth/me', {
          headers: { Authorization: `Bearer ${userAToken}` },
        })
      );
      expect(initialMe.status).toBe(200);

      // 2. User A changes password
      const changeRes = await changePasswordHandler(
        new Request('http://localhost:3000/api/auth/change-password', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            currentPassword: 'Password123!',
            newPassword: 'NewSecurePassword456!',
          }),
        })
      );
      expect(changeRes.status).toBe(200);

      // 3. Old token MUST now be rejected with 401
      const oldTokenMe = await meHandler(
        new Request('http://localhost:3000/api/auth/me', {
          headers: { Authorization: `Bearer ${userAToken}` },
        })
      );
      expect(oldTokenMe.status).toBe(401);

      // 4. Logging in with new password succeeds and returns fresh token
      const loginRes = await loginHandler(
        new Request('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'alpha@echoes.vault',
            password: 'NewSecurePassword456!',
          }),
        })
      );
      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();

      // 5. Fresh token works
      const freshMe = await meHandler(
        new Request('http://localhost:3000/api/auth/me', {
          headers: { Authorization: `Bearer ${loginData.data.token}` },
        })
      );
      expect(freshMe.status).toBe(200);
    });

    it('rejects malformed and forged tokens with 401', async () => {
      const forgedRes = await meHandler(
        new Request('http://localhost:3000/api/auth/me', {
          headers: { Authorization: 'Bearer forged.invalid.jwt_token_signature' },
        })
      );
      expect(forgedRes.status).toBe(401);
    });
  });

  describe('4. Edge Cases, Malformed Cursors & Safe Error Handling', () => {
    it('returns 404 on non-existent MongoDB ObjectId rather than crashing', async () => {
      const randomObjectId = new mongoose.Types.ObjectId().toString();

      const notFoundRes = await getMemoryByIdHandler(
        new Request(`http://localhost:3000/api/memories/${randomObjectId}`, {
          headers: { Authorization: `Bearer ${userAToken}` },
        }),
        { params: Promise.resolve({ id: randomObjectId }) }
      );
      expect(notFoundRes.status).toBe(404);
    });

    it('handles invalid timeline pagination cursors safely', async () => {
      const res = await getTimelineHandler(
        new Request('http://localhost:3000/api/timeline?cursor=invalid_base64_not_json', {
          headers: { Authorization: `Bearer ${userAToken}` },
        })
      );
      // Returns 400 or defaults safely without 500 server crash
      expect([200, 400]).toContain(res.status);
    });

    it('supports empty search queries and returns all user records', async () => {
      await createMemoryHandler(
        new Request('http://localhost:3000/api/memories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            title: 'General Memory',
            content: 'Regular story.',
            memoryDate: '2026-10-01',
          }),
        })
      );

      const searchRes = await getMemoriesHandler(
        new Request('http://localhost:3000/api/memories?search=', {
          headers: { Authorization: `Bearer ${userAToken}` },
        })
      );
      expect(searchRes.status).toBe(200);
      const searchData = await searchRes.json();
      expect(searchData.data.length).toBe(1);
    });
  });
});

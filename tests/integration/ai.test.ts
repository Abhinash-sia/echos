import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDb, closeTestDb, clearTestDb } from '../helpers/db-handler';
import { resetRateLimits } from '@/lib/security/rate-limit';
import { resetMockAiCompletion, setMockAiCompletion } from '@/lib/ai/client';
import { Memory } from '@/models/Memory';
import { TimeCapsule } from '@/models/TimeCapsule';
import { Photo } from '@/models/Photo';
import { MemoryBoard } from '@/models/MemoryBoard';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as timelineSummaryHandler } from '@/app/api/ai/timeline-summary/route';
import { POST as capsuleInsightHandler } from '@/app/api/ai/capsules/[id]/insight/route';
import {
  GET as getBoardHandler,
  POST as generateBoardHandler,
  PUT as saveBoardHandler,
} from '@/app/api/ai/board/route';
import { DELETE as deleteBoardHandler } from '@/app/api/ai/board/[id]/route';
import { GET as getAiStatusHandler } from '@/app/api/ai/status/route';

describe('AI Features Integration Tests (Timeline Summary, Then vs Now, AI Board)', () => {
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
    resetMockAiCompletion();

    const resA = await registerHandler(
      new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alice Vault',
          email: 'alice.ai@example.com',
          password: 'Password123!',
        }),
      })
    );
    const dataA = await resA.json();
    userAToken = dataA.data.token;
    userAId = dataA.data.user._id;

    const resB = await registerHandler(
      new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bob Vault',
          email: 'bob.ai@example.com',
          password: 'Password123!',
        }),
      })
    );
    const dataB = await resB.json();
    userBToken = dataB.data.token;
  });

  afterEach(() => {
    resetMockAiCompletion();
  });

  describe('POST /api/ai/timeline-summary', () => {
    it('summarizes owned memories while never exposing locked capsule secrets to AI', async () => {
      const mem = await Memory.create({
        userId: userAId,
        title: 'Coastal Train Ride',
        content: 'Watched the sunset along the cliffs with a notebook full of ideas.',
        memoryDate: new Date('2026-10-10T12:00:00Z'),
        tags: ['travel', 'writing'],
      });

      const lockedCap = await TimeCapsule.create({
        userId: userAId,
        title: 'Secret Future Note',
        message: 'TOP_SECRET_LOCKED_TEXT_MUST_NEVER_LEAK',
        unlockDate: new Date(Date.now() + 86400000 * 30),
        sealedAt: new Date(),
      });

      let capturedPrompt = '';
      setMockAiCompletion(({ userPrompt }) => {
        capturedPrompt = userPrompt;
        return {
          headline: 'October Horizons',
          summary: 'A reflective coastal journey paired with a sealed milestone.',
          mood: 'Reflective & Hopeful',
          themes: ['travel', 'writing'],
          highlightTitle: 'Coastal Train Ride',
        };
      });

      const res = await timelineSummaryHandler(
        new Request('http://localhost:3000/api/ai/timeline-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            periodLabel: 'October 2026',
            items: [
              { id: mem._id.toString(), type: 'memory' },
              { id: lockedCap._id.toString(), type: 'capsule' },
            ],
          }),
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.headline).toBe('October Horizons');
      expect(body.data.entryCount).toBe(2);
      expect(capturedPrompt).not.toContain('TOP_SECRET_LOCKED_TEXT_MUST_NEVER_LEAK');
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await timelineSummaryHandler(
        new Request('http://localhost:3000/api/ai/timeline-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            periodLabel: 'October 2026',
            items: [{ id: '507f1f77bcf86cd799439011', type: 'memory' }],
          }),
        })
      );
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/ai/capsules/:id/insight', () => {
    it('blocks insight generation with 403 while capsule is still locked', async () => {
      const lockedCap = await TimeCapsule.create({
        userId: userAId,
        title: 'Locked 2027 Letter',
        message: 'Do not read yet!',
        unlockDate: new Date(Date.now() + 86400000 * 60),
        sealedAt: new Date(),
      });

      const res = await capsuleInsightHandler(
        new Request(`http://localhost:3000/api/ai/capsules/${lockedCap._id}/insight`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userAToken}` },
        }),
        { params: { id: lockedCap._id.toString() } }
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.isLocked).toBe(true);
    });

    it('returns 404 when another user tries to analyze the capsule', async () => {
      const unlockedCap = await TimeCapsule.create({
        userId: userAId,
        title: 'Unlocked Letter',
        message: 'Hello future me!',
        unlockDate: new Date(Date.now() - 86400000),
        sealedAt: new Date(Date.now() - 86400000 * 100),
        isOpened: true,
        openedAt: new Date(),
      });

      const res = await capsuleInsightHandler(
        new Request(`http://localhost:3000/api/ai/capsules/${unlockedCap._id}/insight`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userBToken}` },
        }),
        { params: { id: unlockedCap._id.toString() } }
      );

      expect(res.status).toBe(404);
    });

    it('generates Then vs. Now insight for an unlocked capsule with recent memory context', async () => {
      await Memory.create({
        userId: userAId,
        title: 'Graduation Demo Day',
        content: 'Finally presented our software project and celebrated with friends.',
        memoryDate: new Date(),
        tags: ['milestone', 'project'],
      });

      const unlockedCap = await TimeCapsule.create({
        userId: userAId,
        title: 'Freshman Year Hopes',
        message: 'I hope I actually ship something cool before graduation.',
        unlockDate: new Date(Date.now() - 86400000),
        sealedAt: new Date(Date.now() - 86400000 * 365),
        isOpened: true,
        openedAt: new Date(),
      });

      const res = await capsuleInsightHandler(
        new Request(`http://localhost:3000/api/ai/capsules/${unlockedCap._id}/insight`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userAToken}` },
        }),
        { params: { id: unlockedCap._id.toString() } }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.comparedMemoriesCount).toBe(1);
      expect(body.data.thenSummary).toBeTruthy();
      expect(body.data.nowSummary).toBeTruthy();
      expect(Array.isArray(body.data.shifts)).toBe(true);
      expect(body.data.reflectionPrompt).toBeTruthy();
    });
  });

  describe('GET, POST (draft), PUT (save) & DELETE /api/ai/board', () => {
    it('returns [] initially, generates unsaved draft preview, saves multiple boards, and protects locked capsules', async () => {
      const initialGet = await getBoardHandler(
        new Request('http://localhost:3000/api/ai/board', {
          method: 'GET',
          headers: { Authorization: `Bearer ${userAToken}` },
        })
      );
      expect(initialGet.status).toBe(200);
      const initialBody = await initialGet.json();
      expect(initialBody.data.boards).toEqual([]);

      // Seed photo, memories, and a locked capsule
      const mem1 = await Memory.create({
        userId: userAId,
        title: 'Mountain Sunrise',
        content: 'Hiked before dawn and captured golden hour photos.',
        memoryDate: new Date('2026-09-12T06:00:00Z'),
        tags: ['travel', 'nature'],
      });

      const photo = await Photo.create({
        userId: userAId,
        memoryId: mem1._id,
        url: 'https://res.cloudinary.com/demo/image/authenticated/sunrise.jpg',
        publicId: 'echoes/sunrise_photo',
      });
      mem1.photos.push(photo._id);
      await mem1.save();

      const mem2 = await Memory.create({
        userId: userAId,
        title: 'Late Night Coding',
        content: 'Wrapped up the database indexing and timeline API.',
        memoryDate: new Date('2026-10-05T23:00:00Z'),
        tags: ['coding', 'travel'],
      });

      const lockedCap = await TimeCapsule.create({
        userId: userAId,
        title: '2028 Vault Letter',
        message: 'CONFIDENTIAL_CAPSULE_SECRET_DO_NOT_PIN',
        unlockDate: new Date(Date.now() + 86400000 * 365),
        sealedAt: new Date(),
        photos: [photo._id],
      });

      // Generate draft preview (should NOT auto-save to MongoDB)
      const postRes = await generateBoardHandler(
        new Request('http://localhost:3000/api/ai/board', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({ focusPrompt: 'Group by adventures and code' }),
        })
      );

      expect(postRes.status).toBe(200);
      const postBody = await postRes.json();
      expect(postBody.success).toBe(true);
      expect(postBody.data.isDraft).toBe(true);
      expect(postBody.data.pins).toHaveLength(3);

      // Nothing persisted yet until user explicitly saves!
      expect(await MemoryBoard.countDocuments({ userId: userAId })).toBe(0);

      // Verify locked capsule message & photos are NOT exposed on draft
      const lockedPin = postBody.data.pins.find(
        (p: { itemId: string }) => p.itemId === lockedCap._id.toString()
      );
      expect(lockedPin).toBeDefined();
      expect(lockedPin.isLocked).toBe(true);
      expect(lockedPin.excerpt).not.toContain('CONFIDENTIAL_CAPSULE_SECRET_DO_NOT_PIN');
      expect(lockedPin.photos).toEqual([]);

      // Verify photo memory has a signedUrl
      const photoPin = postBody.data.pins.find(
        (p: { itemId: string }) => p.itemId === mem1._id.toString()
      );
      expect(photoPin.photos).toHaveLength(1);
      expect(photoPin.photos[0].signedUrl).toBeTruthy();

      // Explicitly save Board #1
      const saveRes1 = await saveBoardHandler(
        new Request('http://localhost:3000/api/ai/board', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            boardTitle: 'Adventure & Code Board',
            curatorNote: postBody.data.curatorNote,
            focusPrompt: postBody.data.focusPrompt,
            generationMode: postBody.data.generationMode,
            modelName: postBody.data.modelName,
            clusters: postBody.data.clusters,
            pins: postBody.data.pins,
            connections: postBody.data.connections,
          }),
        })
      );
      expect(saveRes1.status).toBe(201);
      const saved1 = (await saveRes1.json()).data;
      expect(saved1.isDraft).toBe(false);
      expect(saved1.boardTitle).toBe('Adventure & Code Board');

      // Explicitly save Board #2 (multi-board support!)
      const saveRes2 = await saveBoardHandler(
        new Request('http://localhost:3000/api/ai/board', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            boardTitle: 'Second Saved Board',
            curatorNote: postBody.data.curatorNote,
            generationMode: postBody.data.generationMode,
            modelName: postBody.data.modelName,
            clusters: postBody.data.clusters,
            pins: postBody.data.pins,
            connections: postBody.data.connections,
          }),
        })
      );
      expect(saveRes2.status).toBe(201);
      const saved2 = (await saveRes2.json()).data;

      // Delete mem2 and verify GET returns both saved boards hydrated without dangling deleted item
      await Memory.findByIdAndDelete(mem2._id);

      const getAfterDelete = await getBoardHandler(
        new Request('http://localhost:3000/api/ai/board', {
          method: 'GET',
          headers: { Authorization: `Bearer ${userAToken}` },
        })
      );
      expect(getAfterDelete.status).toBe(200);
      const hydratedAfterDelete = await getAfterDelete.json();
      expect(hydratedAfterDelete.data.boards).toHaveLength(2);
      expect(hydratedAfterDelete.data.boards[0].pins).toHaveLength(2);

      // Other user cannot delete user A's saved board
      const forbiddenDel = await deleteBoardHandler(
        new Request(`http://localhost:3000/api/ai/board/${saved2._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${userBToken}` },
        }),
        { params: { id: saved2._id } }
      );
      expect(forbiddenDel.status).toBe(404);

      // Owner can delete Board #2 while Board #1 stays intact
      const ownerDel = await deleteBoardHandler(
        new Request(`http://localhost:3000/api/ai/board/${saved2._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${userAToken}` },
        }),
        { params: { id: saved2._id } }
      );
      expect(ownerDel.status).toBe(200);
      expect(await MemoryBoard.countDocuments({ userId: userAId })).toBe(1);
    });

    it('strictly filters board pins when focusPrompt asks for a specific topic (e.g. "lady board")', async () => {
      const ladyMem = await Memory.create({
        userId: userAId,
        title: 'saw a pretty lady',
        content: 'Saw a very pretty lady today.',
        memoryDate: new Date('2026-11-10T10:00:00Z'),
        tags: ['pretty', 'beautiful'],
      });

      const shatMem = await Memory.create({
        userId: userAId,
        title: 'Shat a ton',
        content: 'Shat a ton when felt ill.',
        memoryDate: new Date('2026-11-09T10:00:00Z'),
        tags: ['ill'],
      });

      await TimeCapsule.create({
        userId: userAId,
        title: 'A very bad decision',
        message: 'Future note',
        unlockDate: new Date(Date.now() + 86400000 * 30),
        sealedAt: new Date(),
      });

      // Topic match should ONLY return the 1 matching memory
      const ladyRes = await generateBoardHandler(
        new Request('http://localhost:3000/api/ai/board', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({ focusPrompt: 'lady board' }),
        })
      );

      expect(ladyRes.status).toBe(200);
      const ladyBody = await ladyRes.json();
      expect(ladyBody.data.pins).toHaveLength(1);
      expect(ladyBody.data.pins[0].itemId).toBe(ladyMem._id.toString());
      expect(ladyBody.data.pins[0].title).toBe('saw a pretty lady');

      // Non-matching topic should return 0 pins cleanly instead of stuffing unrelated items
      const emptyRes = await generateBoardHandler(
        new Request('http://localhost:3000/api/ai/board', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({ focusPrompt: 'astronauts' }),
        })
      );
      expect(emptyRes.status).toBe(200);
      const emptyBody = await emptyRes.json();
      expect(emptyBody.data.pins).toHaveLength(0);
      expect(emptyBody.data.clusters).toHaveLength(0);

      // AI semantic relevance scoring ("poop" -> "Shat a ton") without hardcoded synonyms
      setMockAiCompletion(({ systemPrompt }) => {
        if (systemPrompt.includes('Evaluate EVERY item in the list')) {
          return {
            items: [
              { ref: '1', about: 'Pretty woman seen', score: 1 },
              { ref: '2', about: 'Feces or digestive distress', score: 5 },
            ],
          };
        }
        return {
          boardTitle: 'Poop Chronicles',
          curatorNote: 'Matched by meaning.',
          clusters: [
            {
              id: 'cluster-1',
              label: 'Rough Moments',
              color: 'teal',
              summary: 'Digestive adventures.',
            },
          ],
          pins: [
            {
              itemId: shatMem._id.toString(),
              itemType: 'memory',
              clusterId: 'cluster-1',
              stickyNote: 'Matched semantically.',
              rotation: -1,
              pinStyle: 'index-card',
            },
          ],
          connections: [],
        };
      });

      const poopRes = await generateBoardHandler(
        new Request('http://localhost:3000/api/ai/board', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({ focusPrompt: 'poop' }),
        })
      );
      expect(poopRes.status).toBe(200);
      const poopBody = await poopRes.json();
      expect(poopBody.data.pins).toHaveLength(1);
      expect(poopBody.data.pins[0].title).toBe('Shat a ton');
      resetMockAiCompletion();
    });

    it('separates negative/illness memories and locked capsules out of positive-emotion clusters', async () => {
      const prettyMem = await Memory.create({
        userId: userAId,
        title: 'saw a pretty lady',
        content: 'Saw a very pretty lady today.',
        memoryDate: new Date('2026-11-10T10:00:00Z'),
        tags: ['pretty'],
      });

      const illMem = await Memory.create({
        userId: userAId,
        title: 'Shat a ton',
        content: 'Shat a ton when felt ill.',
        memoryDate: new Date('2026-11-09T10:00:00Z'),
        tags: ['ill'],
      });

      const lockedCap = await TimeCapsule.create({
        userId: userAId,
        title: 'A very bad decision',
        message: 'Secret',
        unlockDate: new Date(Date.now() + 86400000 * 30),
        sealedAt: new Date(),
      });

      // Simulate a 3B model lazily dumping everything into "Positive Emotions"
      setMockAiCompletion(() => ({
        boardTitle: 'Life Moments',
        curatorNote: 'Grouped memories.',
        clusters: [
          {
            id: 'cluster-1',
            label: 'Positive Emotions',
            color: 'coral',
            summary: 'Memories of happy moments and positive interactions.',
          },
        ],
        pins: [
          {
            itemId: prettyMem._id.toString(),
            itemType: 'memory',
            clusterId: 'cluster-1',
            stickyNote: 'Brought joy to my day.',
            rotation: -2,
            pinStyle: 'index-card',
          },
          {
            itemId: illMem._id.toString(),
            itemType: 'memory',
            clusterId: 'cluster-1',
            stickyNote: 'Learned to cope with positive emotions.',
            rotation: 1,
            pinStyle: 'index-card',
          },
          {
            itemId: lockedCap._id.toString(),
            itemType: 'capsule',
            clusterId: 'cluster-1',
            stickyNote: 'Sealed capsule.',
            rotation: 0,
            pinStyle: 'wax-seal',
          },
        ],
        connections: [],
      }));

      const res = await generateBoardHandler(
        new Request('http://localhost:3000/api/ai/board', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({}),
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.clusters.length).toBe(3);

      const prettyPin = body.data.pins.find(
        (p: { itemId: string }) => p.itemId === prettyMem._id.toString()
      );
      const illPin = body.data.pins.find(
        (p: { itemId: string }) => p.itemId === illMem._id.toString()
      );
      const capPin = body.data.pins.find(
        (p: { itemId: string }) => p.itemId === lockedCap._id.toString()
      );

      expect(prettyPin.clusterId).toBe('cluster-1');
      expect(illPin.clusterId).not.toBe('cluster-1');
      expect(capPin.clusterId).not.toBe('cluster-1');
      expect(illPin.clusterId).not.toBe(capPin.clusterId);
    });
  });

  describe('GET /api/ai/status', () => {
    it('requires authentication and returns provider status when authenticated', async () => {
      const unauth = await getAiStatusHandler(
        new Request('http://localhost:3000/api/ai/status', { method: 'GET' })
      );
      expect(unauth.status).toBe(401);

      setMockAiCompletion(() => ({ ok: true }));
      const authed = await getAiStatusHandler(
        new Request('http://localhost:3000/api/ai/status', {
          method: 'GET',
          headers: { Authorization: `Bearer ${userAToken}` },
        })
      );
      expect(authed.status).toBe(200);
      const body = await authed.json();
      expect(body.success).toBe(true);
      expect(body.data.connected).toBe(true);
      expect(body.data.modelAvailable).toBe(true);
    });
  });
});


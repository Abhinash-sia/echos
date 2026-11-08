import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDb, closeTestDb, clearTestDb } from '../helpers/db-handler';
import { resetRateLimits } from '@/lib/security/rate-limit';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as createMemoryHandler, GET as getMemoriesHandler } from '@/app/api/memories/route';
import {
  GET as getMemoryByIdHandler,
  PATCH as updateMemoryHandler,
  DELETE as deleteMemoryHandler,
} from '@/app/api/memories/[id]/route';

describe('Memory Journal API Integration Tests', () => {
  let userAToken: string;
  let userBToken: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    resetRateLimits();

    // Create User A
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

    // Create User B
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

    resetRateLimits();
  });

  describe('POST /api/memories (Creation)', () => {
    it('should create a memory successfully with normalized tags and derive owner from session', async () => {
      const request = new Request('http://localhost:3000/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: 'Graduation Ceremony',
          content: 'Received my Bachelor of Engineering degree with honors.',
          memoryDate: '2025-06-15T10:00:00.000Z',
          tags: ['COLLEGE', 'Engineering ', 'academics'],
        }),
      });

      const response = await createMemoryHandler(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.title).toBe('Graduation Ceremony');
      expect(json.data.content).toBe('Received my Bachelor of Engineering degree with honors.');
      expect(json.data.tags).toEqual(['college', 'engineering', 'academics']);
      expect(json.data.photos).toEqual([]);
      expect(json.data.userId).toBeDefined();
    });

    it('should reject creation when unauthenticated with 401 Unauthorized', async () => {
      const request = new Request('http://localhost:3000/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthenticated Memory',
          content: 'Content',
          memoryDate: '2025-01-01',
        }),
      });

      const response = await createMemoryHandler(request);
      expect(response.status).toBe(401);
    });

    it('should reject creation with missing required fields (title, content, memoryDate)', async () => {
      const request = new Request('http://localhost:3000/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: '',
        }),
      });

      const response = await createMemoryHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Validation failed');
    });

    it('should reject creation when date format is invalid', async () => {
      const request = new Request('http://localhost:3000/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: 'Invalid Date Memory',
          content: 'Some valid content',
          memoryDate: 'not-a-valid-date',
        }),
      });

      const response = await createMemoryHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Validation failed');
    });
  });

  describe('GET /api/memories/:id (Single Memory Retrieval)', () => {
    let memoryId: string;

    beforeEach(async () => {
      const res = await createMemoryHandler(
        new Request('http://localhost:3000/api/memories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            title: 'User A Secret Trip',
            content: 'Solo hiking in the mountains.',
            memoryDate: '2025-05-10T08:00:00Z',
            tags: ['hiking', 'nature'],
          }),
        })
      );
      const data = await res.json();
      memoryId = data.data._id;
    });

    it('should retrieve individual memory for the owner', async () => {
      const request = new Request(`http://localhost:3000/api/memories/${memoryId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getMemoryByIdHandler(request, { params: { id: memoryId } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data._id).toBe(memoryId);
      expect(json.data.title).toBe('User A Secret Trip');
    });

    it('should enforce user isolation: User B cannot retrieve User A memory (404 Not Found)', async () => {
      const request = new Request(`http://localhost:3000/api/memories/${memoryId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userBToken}` },
      });

      const response = await getMemoryByIdHandler(request, { params: { id: memoryId } });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toContain('Memory not found or access denied');
    });

    it('should reject invalid MongoDB ID format with 400 Bad Request', async () => {
      const request = new Request('http://localhost:3000/api/memories/invalid-id', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getMemoryByIdHandler(request, { params: { id: 'invalid-id' } });
      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/memories/:id (Update Memory)', () => {
    let memoryId: string;

    beforeEach(async () => {
      const res = await createMemoryHandler(
        new Request('http://localhost:3000/api/memories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            title: 'Initial Title',
            content: 'Initial Content',
            memoryDate: '2025-01-01T00:00:00Z',
            tags: ['initial'],
          }),
        })
      );
      const data = await res.json();
      memoryId = data.data._id;
    });

    it('should update memory fields successfully for owner', async () => {
      const request = new Request(`http://localhost:3000/api/memories/${memoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: 'Updated Title',
          content: 'Updated Content',
          tags: ['updated', 'tags'],
        }),
      });

      const response = await updateMemoryHandler(request, { params: { id: memoryId } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.title).toBe('Updated Title');
      expect(json.data.content).toBe('Updated Content');
      expect(json.data.tags).toEqual(['updated', 'tags']);
    });

    it('should reject update if empty body is supplied', async () => {
      const request = new Request(`http://localhost:3000/api/memories/${memoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({}),
      });

      const response = await updateMemoryHandler(request, { params: { id: memoryId } });
      expect(response.status).toBe(400);
    });

    it('should enforce user isolation: User B cannot update User A memory (404)', async () => {
      const request = new Request(`http://localhost:3000/api/memories/${memoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userBToken}`,
        },
        body: JSON.stringify({ title: 'Hacked Title' }),
      });

      const response = await updateMemoryHandler(request, { params: { id: memoryId } });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/memories/:id (Delete Memory)', () => {
    let memoryId: string;

    beforeEach(async () => {
      const res = await createMemoryHandler(
        new Request('http://localhost:3000/api/memories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({
            title: 'Memory To Be Deleted',
            content: 'Content',
            memoryDate: '2025-03-01T00:00:00Z',
          }),
        })
      );
      const data = await res.json();
      memoryId = data.data._id;
    });

    it('should delete memory successfully for owner', async () => {
      const request = new Request(`http://localhost:3000/api/memories/${memoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await deleteMemoryHandler(request, { params: { id: memoryId } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);

      // Verify it is gone
      const checkRes = await getMemoryByIdHandler(
        new Request(`http://localhost:3000/api/memories/${memoryId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${userAToken}` },
        }),
        { params: { id: memoryId } }
      );
      expect(checkRes.status).toBe(404);
    });

    it('should prevent unauthorized deletion by another user (404)', async () => {
      const request = new Request(`http://localhost:3000/api/memories/${memoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userBToken}` },
      });

      const response = await deleteMemoryHandler(request, { params: { id: memoryId } });
      expect(response.status).toBe(404);

      // Verify memory still exists for User A
      const checkRes = await getMemoryByIdHandler(
        new Request(`http://localhost:3000/api/memories/${memoryId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${userAToken}` },
        }),
        { params: { id: memoryId } }
      );
      expect(checkRes.status).toBe(200);
    });
  });

  describe('GET /api/memories (Search, Filter, Pagination)', () => {
    beforeEach(async () => {
      // Seed User A memories with different dates and tags
      const items = [
        {
          title: 'Summer Vacation in Spain',
          content: 'Enjoyed sunny beaches and delicious paella.',
          memoryDate: '2024-07-15T12:00:00Z',
          tags: ['travel', 'europe', 'beach'],
        },
        {
          title: 'Winter Skiing in Alps',
          content: 'Chilly snow adventures and cozy chalets.',
          memoryDate: '2024-12-20T12:00:00Z',
          tags: ['travel', 'winter', 'mountains'],
        },
        {
          title: 'College Hackathon Victory',
          content: 'Built an open source AI project and won first place.',
          memoryDate: '2025-03-10T12:00:00Z',
          tags: ['college', 'tech', 'coding'],
        },
        {
          title: 'Family Thanksgiving Dinner',
          content: 'Gathered with parents and cousins for gratitude feast.',
          memoryDate: '2025-11-25T12:00:00Z',
          tags: ['family', 'dinner'],
        },
      ];

      for (const item of items) {
        await createMemoryHandler(
          new Request('http://localhost:3000/api/memories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify(item),
          })
        );
      }

      // Seed one memory for User B to verify user isolation
      await createMemoryHandler(
        new Request('http://localhost:3000/api/memories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userBToken}`,
          },
          body: JSON.stringify({
            title: 'User B Vacation',
            content: 'User B travel memory',
            memoryDate: '2025-01-01T00:00:00Z',
            tags: ['travel'],
          }),
        })
      );
    });

    it('should retrieve only the authenticated user memories', async () => {
      const request = new Request('http://localhost:3000/api/memories', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getMemoriesHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(4);
      expect(json.pagination.total).toBe(4);
      // Ensure User B's memory is NOT present
      const titles = json.data.map((m: { title: string }) => m.title);
      expect(titles).not.toContain('User B Vacation');
    });

    it('should search memories by keyword across title and content', async () => {
      const request = new Request('http://localhost:3000/api/memories?search=Hackathon', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getMemoriesHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].title).toBe('College Hackathon Victory');
    });

    it('should filter memories by tag', async () => {
      const request = new Request('http://localhost:3000/api/memories?tags=travel', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getMemoriesHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2); // Spain and Alps
    });

    it('should filter memories by date range (startDate and endDate)', async () => {
      const request = new Request(
        'http://localhost:3000/api/memories?startDate=2024-01-01&endDate=2024-12-31',
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );

      const response = await getMemoriesHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2); // Summer Vacation (July 2024) and Winter Skiing (Dec 2024)
    });

    it('should paginate results with consistent metadata', async () => {
      const request = new Request('http://localhost:3000/api/memories?page=1&limit=2', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getMemoriesHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2);
      expect(json.pagination.page).toBe(1);
      expect(json.pagination.limit).toBe(2);
      expect(json.pagination.total).toBe(4);
      expect(json.pagination.totalPages).toBe(2);
      expect(json.pagination.hasNextPage).toBe(true);
      expect(json.pagination.hasPrevPage).toBe(false);
    });

    it('should sort memories in ascending chronological order when requested', async () => {
      const request = new Request('http://localhost:3000/api/memories?sortOrder=asc', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getMemoriesHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const dates = json.data.map((m: { memoryDate: string }) => new Date(m.memoryDate).getTime());
      expect(dates[0]).toBeLessThan(dates[1]);
    });

    it('should reject search query exceeding 100 characters with 400', async () => {
      const longQuery = 'a'.repeat(101);
      const request = new Request(`http://localhost:3000/api/memories?search=${longQuery}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getMemoriesHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('cannot exceed 100 characters');
    });

    it('should reject invalid startDate or endDate format with 400', async () => {
      const reqInvalidStart = new Request(
        'http://localhost:3000/api/memories?startDate=invalid-date',
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );
      const resInvalidStart = await getMemoriesHandler(reqInvalidStart);
      expect(resInvalidStart.status).toBe(400);

      const reqInvalidEnd = new Request('http://localhost:3000/api/memories?endDate=not-a-date', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const resInvalidEnd = await getMemoriesHandler(reqInvalidEnd);
      expect(resInvalidEnd.status).toBe(400);
    });

    it('should reject startDate greater than endDate with 400 Bad Request', async () => {
      const request = new Request(
        'http://localhost:3000/api/memories?startDate=2025-12-31&endDate=2025-01-01',
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );

      const response = await getMemoriesHandler(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('startDate must be less than or equal to endDate');
    });

    it('should handle large page numbers gracefully returning empty array without error', async () => {
      const request = new Request('http://localhost:3000/api/memories?page=9999&limit=10', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getMemoriesHandler(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
      expect(json.pagination.page).toBe(9999);
      expect(json.pagination.total).toBe(4);
      expect(json.pagination.hasNextPage).toBe(false);
      expect(json.pagination.hasPrevPage).toBe(true);
    });
  });
});

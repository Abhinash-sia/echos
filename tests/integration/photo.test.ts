import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { connectTestDb, closeTestDb, clearTestDb } from '../helpers/db-handler';
import { resetRateLimits } from '@/lib/security/rate-limit';
import {
  setMockCloudinary,
  resetMockCloudinary,
  MockCloudinaryUploader,
} from '@/lib/media/cloudinary';
import { Memory } from '@/models/Memory';
import { Photo } from '@/models/Photo';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as createMemoryHandler } from '@/app/api/memories/route';
import { DELETE as deleteMemoryHandler } from '@/app/api/memories/[id]/route';
import {
  POST as uploadPhotoHandler,
  GET as getPhotosHandler,
} from '@/app/api/memories/[id]/photos/route';
import {
  DELETE as deletePhotoHandler,
  PATCH as movePhotoHandler,
} from '@/app/api/memories/[id]/photos/[photoId]/route';

// Helper to construct a valid JPEG File object
function createMockImageFile(name: string = 'sample.jpg', size: number = 1024): File {
  const buffer = Buffer.alloc(size);
  // JPEG magic bytes: FF D8 FF
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  return new File([buffer], name, { type: 'image/jpeg' });
}

describe('Photo Management & Cloudinary Integration Tests', () => {
  let userAToken: string;
  let userBToken: string;
  let memoryAId: string;
  let memoryA2Id: string;

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
      public_id: options.publicId || 'echoes/test_sample_123',
      secure_url: 'https://res.cloudinary.com/test-cloud/image/authenticated/test_sample_123.jpg',
      format: 'jpg',
      width: 1920,
      height: 1080,
      bytes: 204800,
    }));

    mockDestroyFn = vi.fn().mockResolvedValue({ result: 'ok' });

    setMockCloudinary({
      upload: mockUploadFn,
      destroy: mockDestroyFn,
    } as MockCloudinaryUploader);

    // Register User A
    const resA = await registerHandler(
      new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Photo User A',
          email: 'photousera@example.com',
          password: 'Password123!',
        }),
      })
    );
    const dataA = await resA.json();
    userAToken = dataA.data.token;

    // Register User B
    const resB = await registerHandler(
      new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Photo User B',
          email: 'photouserb@example.com',
          password: 'Password123!',
        }),
      })
    );
    const dataB = await resB.json();
    userBToken = dataB.data.token;

    // Create Memories for User A
    const memRes1 = await createMemoryHandler(
      new Request('http://localhost:3000/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: 'Memory One for Photos',
          content: 'Attaching vacation pictures.',
          memoryDate: '2025-06-01T00:00:00Z',
        }),
      })
    );
    const memData1 = await memRes1.json();
    memoryAId = memData1.data._id;

    const memRes2 = await createMemoryHandler(
      new Request('http://localhost:3000/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          title: 'Memory Two for Move Target',
          content: 'Destination for moved photos.',
          memoryDate: '2025-06-02T00:00:00Z',
        }),
      })
    );
    const memData2 = await memRes2.json();
    memoryA2Id = memData2.data._id;
  });

  afterEach(() => {
    resetMockCloudinary();
  });

  describe('POST /api/memories/:id/photos (Photo Upload)', () => {
    it('should upload a photo using mocked Cloudinary, save Photo record, and update Memory.photos', async () => {
      const formData = new FormData();
      formData.append('file', createMockImageFile('beach.jpg', 2048));

      const request = new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userAToken}`,
        },
        body: formData,
      });

      const response = await uploadPhotoHandler(request, { params: { id: memoryAId } });
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.publicId).toBeDefined();
      expect(json.data.signedUrl).toBeDefined();
      expect(json.data.signedUrl).toContain('image/authenticated');
      expect(json.data.signedUrl).toMatch(/\/s--[A-Za-z0-9_-]+--\//);
      expect(mockUploadFn).toHaveBeenCalledTimes(1);

      // Verify relationship consistency in MongoDB
      const updatedMemory = await Memory.findById(memoryAId);
      const photoIds = (updatedMemory?.photos || []).map((p) => p.toString());
      expect(photoIds).toContain(json.data._id);

      const savedPhoto = await Photo.findById(json.data._id);
      expect(savedPhoto?.memoryId?.toString()).toBe(memoryAId);
    });

    it('should reject upload when file is missing in multipart body with 400', async () => {
      const formData = new FormData();

      const request = new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
        body: formData,
      });

      const response = await uploadPhotoHandler(request, { params: { id: memoryAId } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('valid photo file must be provided');
    });

    it('should reject invalid MIME types (e.g. text or pdf) with 400', async () => {
      const textBlob = new Blob(['Sample text'], { type: 'text/plain' });
      const textFile = new File([textBlob], 'document.txt', { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', textFile);

      const request = new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
        body: formData,
      });

      const response = await uploadPhotoHandler(request, { params: { id: memoryAId } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('Unsupported media type');
    });

    it('should reject oversized photos exceeding 10MB limit with 400', async () => {
      const oversizedFile = createMockImageFile('oversized.jpg', 11 * 1024 * 1024);
      const formData = new FormData();
      formData.append('file', oversizedFile);

      const request = new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
        body: formData,
      });

      const response = await uploadPhotoHandler(request, { params: { id: memoryAId } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('exceeds the 10MB limit');
    });

    it('should prevent unauthorized upload: User B cannot upload to User A memory (404)', async () => {
      const formData = new FormData();
      formData.append('file', createMockImageFile('intruder.jpg'));

      const request = new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userBToken}` },
        body: formData,
      });

      const response = await uploadPhotoHandler(request, { params: { id: memoryAId } });
      expect(response.status).toBe(404);
      expect(mockUploadFn).not.toHaveBeenCalled();
    });

    it('should handle Cloudinary upload failures gracefully with 502 Bad Gateway', async () => {
      mockUploadFn.mockRejectedValueOnce(new Error('Cloudinary server connection timed out'));

      const formData = new FormData();
      formData.append('file', createMockImageFile('fail.jpg'));

      const request = new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
        body: formData,
      });

      const response = await uploadPhotoHandler(request, { params: { id: memoryAId } });
      expect(response.status).toBe(502);

      // Verify no photo record was inserted
      const count = await Photo.countDocuments({ memoryId: memoryAId });
      expect(count).toBe(0);
    });

    it('should trigger compensating rollback (destroy asset) if database persistence fails after upload', async () => {
      // Force database error by spying on Photo.create
      vi.spyOn(Photo, 'create').mockRejectedValueOnce(new Error('Mongoose write error'));

      const formData = new FormData();
      formData.append('file', createMockImageFile('rollback.jpg'));

      const request = new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
        body: formData,
      });

      const response = await uploadPhotoHandler(request, { params: { id: memoryAId } });
      expect(response.status).toBe(500);

      // Verify compensating destroy call was invoked to delete the orphaned asset
      expect(mockDestroyFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/memories/:id/photos (Retrieve Photos)', () => {
    it('should retrieve all photos for a memory with signed delivery URLs', async () => {
      // Upload 2 photos
      const form1 = new FormData();
      form1.append('file', createMockImageFile('photo1.jpg'));
      await uploadPhotoHandler(
        new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userAToken}` },
          body: form1,
        }),
        { params: { id: memoryAId } }
      );

      const form2 = new FormData();
      form2.append('file', createMockImageFile('photo2.jpg'));
      await uploadPhotoHandler(
        new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userAToken}` },
          body: form2,
        }),
        { params: { id: memoryAId } }
      );

      const request = new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      const response = await getPhotosHandler(request, { params: { id: memoryAId } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2);
      expect(json.data[0].signedUrl).toBeDefined();
      expect(json.data[1].signedUrl).toBeDefined();
    });
  });

  describe('DELETE /api/memories/:id/photos/:photoId (Delete Photo)', () => {
    let photoId: string;
    let photoPublicId: string;

    beforeEach(async () => {
      const form = new FormData();
      form.append('file', createMockImageFile('delete_me.jpg'));
      const res = await uploadPhotoHandler(
        new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userAToken}` },
          body: form,
        }),
        { params: { id: memoryAId } }
      );
      const data = await res.json();
      photoId = data.data._id;
      photoPublicId = data.data.publicId;
    });

    it('should delete photo from MongoDB, remove from Memory.photos, and purge from Cloudinary', async () => {
      const request = new Request(
        `http://localhost:3000/api/memories/${memoryAId}/photos/${photoId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );

      const response = await deletePhotoHandler(request, {
        params: { id: memoryAId, photoId },
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);

      // Verify Cloudinary destroy was executed
      expect(mockDestroyFn).toHaveBeenCalledWith(photoPublicId);

      // Verify Photo record is removed
      const photoDoc = await Photo.findById(photoId);
      expect(photoDoc).toBeNull();

      // Verify unlinked from Memory.photos
      const memoryDoc = await Memory.findById(memoryAId);
      expect(memoryDoc?.photos).not.toContainEqual(photoId);
    });

    it('should prevent unauthorized deletion by User B (404)', async () => {
      const request = new Request(
        `http://localhost:3000/api/memories/${memoryAId}/photos/${photoId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${userBToken}` },
        }
      );

      const response = await deletePhotoHandler(request, {
        params: { id: memoryAId, photoId },
      });
      expect(response.status).toBe(404);
      expect(mockDestroyFn).not.toHaveBeenCalled();
    });

    it('should preserve database record and return 502 if Cloudinary destruction fails during photo deletion', async () => {
      mockDestroyFn.mockRejectedValueOnce(new Error('Cloudinary timeout on asset destruction'));

      const request = new Request(
        `http://localhost:3000/api/memories/${memoryAId}/photos/${photoId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );

      const response = await deletePhotoHandler(request, {
        params: { id: memoryAId, photoId },
      });
      expect(response.status).toBe(502);

      // Verify photo record was NOT prematurely deleted from MongoDB
      const photoDoc = await Photo.findById(photoId);
      expect(photoDoc).not.toBeNull();

      // Verify photo is still linked in Memory.photos
      const memoryDoc = await Memory.findById(memoryAId);
      const photoIds = (memoryDoc?.photos || []).map((p) => p.toString());
      expect(photoIds).toContain(photoId);
    });
  });

  describe('PATCH /api/memories/:id/photos/:photoId (Move Photo Between Memories)', () => {
    let photoId: string;

    beforeEach(async () => {
      const form = new FormData();
      form.append('file', createMockImageFile('movable.jpg'));
      const res = await uploadPhotoHandler(
        new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userAToken}` },
          body: form,
        }),
        { params: { id: memoryAId } }
      );
      const data = await res.json();
      photoId = data.data._id;
    });

    it('should successfully move photo to another memory owned by the same user', async () => {
      const request = new Request(
        `http://localhost:3000/api/memories/${memoryAId}/photos/${photoId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({ targetMemoryId: memoryA2Id }),
        }
      );

      const response = await movePhotoHandler(request, {
        params: { id: memoryAId, photoId },
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);

      // Verify source memory no longer has the photo
      const source = await Memory.findById(memoryAId);
      const sourcePhotoIds = (source?.photos || []).map((p) => p.toString());
      expect(sourcePhotoIds).not.toContain(photoId);

      // Verify target memory has the photo
      const target = await Memory.findById(memoryA2Id);
      const targetPhotoIds = (target?.photos || []).map((p) => p.toString());
      expect(targetPhotoIds).toContain(photoId);

      // Verify photo.memoryId is updated
      const photo = await Photo.findById(photoId);
      expect(photo?.memoryId?.toString()).toBe(memoryA2Id);
    });

    it('should prevent moving photo to a target memory owned by another user (404)', async () => {
      // Create memory owned by User B
      const memResB = await createMemoryHandler(
        new Request('http://localhost:3000/api/memories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userBToken}`,
          },
          body: JSON.stringify({
            title: 'User B Vault',
            content: 'Private to B',
            memoryDate: '2025-01-01',
          }),
        })
      );
      const memDataB = await memResB.json();
      const userBMemoryId = memDataB.data._id;

      const request = new Request(
        `http://localhost:3000/api/memories/${memoryAId}/photos/${photoId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({ targetMemoryId: userBMemoryId }),
        }
      );

      const response = await movePhotoHandler(request, {
        params: { id: memoryAId, photoId },
      });
      expect(response.status).toBe(404);

      // Verify photo remains in source memory
      const source = await Memory.findById(memoryAId);
      const sourcePhotoIds = (source?.photos || []).map((p) => p.toString());
      expect(sourcePhotoIds).toContain(photoId);
    });

    it('should prevent User B from moving a photo belonging to User A (404)', async () => {
      const request = new Request(
        `http://localhost:3000/api/memories/${memoryAId}/photos/${photoId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userBToken}`,
          },
          body: JSON.stringify({ targetMemoryId: memoryA2Id }),
        }
      );

      const response = await movePhotoHandler(request, {
        params: { id: memoryAId, photoId },
      });
      expect(response.status).toBe(404);
    });

    it('should trigger compensating rollback (clean target, restore source) if photo.save fails during move', async () => {
      // Force database error when saving the photo document
      vi.spyOn(Photo.prototype, 'save').mockRejectedValueOnce(
        new Error('Database connectivity interrupted during photo relocation')
      );

      const request = new Request(
        `http://localhost:3000/api/memories/${memoryAId}/photos/${photoId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAToken}`,
          },
          body: JSON.stringify({ targetMemoryId: memoryA2Id }),
        }
      );

      const response = await movePhotoHandler(request, {
        params: { id: memoryAId, photoId },
      });
      expect(response.status).toBe(500);

      // Verify compensating rollback: photo is restored in source memory
      const source = await Memory.findById(memoryAId);
      const sourcePhotoIds = (source?.photos || []).map((p) => p.toString());
      expect(sourcePhotoIds).toContain(photoId);

      // Verify compensating rollback: photo was NOT left dangling in target memory
      const target = await Memory.findById(memoryA2Id);
      const targetPhotoIds = (target?.photos || []).map((p) => p.toString());
      expect(targetPhotoIds).not.toContain(photoId);
    });
  });

  describe('Memory Deletion Cleanup Cascading to Associated Photos', () => {
    it('should delete all associated photos from Cloudinary and DB when memory is deleted', async () => {
      // Upload 2 photos to memory
      const form1 = new FormData();
      form1.append('file', createMockImageFile('cascade1.jpg'));
      await uploadPhotoHandler(
        new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userAToken}` },
          body: form1,
        }),
        { params: { id: memoryAId } }
      );

      const form2 = new FormData();
      form2.append('file', createMockImageFile('cascade2.jpg'));
      await uploadPhotoHandler(
        new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userAToken}` },
          body: form2,
        }),
        { params: { id: memoryAId } }
      );

      expect(await Photo.countDocuments({ memoryId: memoryAId })).toBe(2);

      // Delete the memory
      const deleteReq = new Request(`http://localhost:3000/api/memories/${memoryAId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const deleteRes = await deleteMemoryHandler(deleteReq, { params: { id: memoryAId } });
      expect(deleteRes.status).toBe(200);

      // Verify Cloudinary destroy was called for both photos
      expect(mockDestroyFn).toHaveBeenCalledTimes(2);

      // Verify all Photo documents for this memory are gone
      const remainingPhotos = await Photo.countDocuments({ memoryId: memoryAId });
      expect(remainingPhotos).toBe(0);
    });

    it('should preserve memory and photos in MongoDB and return 502 if Cloudinary destroy fails during memory deletion', async () => {
      // Upload a photo
      const form = new FormData();
      form.append('file', createMockImageFile('cascade_fail.jpg'));
      await uploadPhotoHandler(
        new Request(`http://localhost:3000/api/memories/${memoryAId}/photos`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userAToken}` },
          body: form,
        }),
        { params: { id: memoryAId } }
      );

      // Force Cloudinary destroy failure
      mockDestroyFn.mockRejectedValueOnce(new Error('Cloudinary unavailable'));

      const deleteReq = new Request(`http://localhost:3000/api/memories/${memoryAId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const deleteRes = await deleteMemoryHandler(deleteReq, { params: { id: memoryAId } });
      expect(deleteRes.status).toBe(502);

      // Verify Memory document is NOT deleted from MongoDB
      const memory = await Memory.findById(memoryAId);
      expect(memory).not.toBeNull();

      // Verify Photo document is NOT deleted from MongoDB
      const remainingPhotos = await Photo.countDocuments({ memoryId: memoryAId });
      expect(remainingPhotos).toBe(1);
    });
  });
});

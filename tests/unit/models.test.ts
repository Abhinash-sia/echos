import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectTestDb, closeTestDb, clearTestDb } from '../helpers/db-handler';
import { User, Photo, Memory, TimeCapsule } from '@/models';

describe('Database Models Specification Tests', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('User Model', () => {
    it('should create and save a valid user successfully', async () => {
      const user = await User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
      });

      expect(user._id).toBeDefined();
      expect(user.name).toBe('Jane Doe');
      expect(user.email).toBe('jane@example.com');
      expect(user.tokenVersion).toBe(0);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should fail validation if required fields are missing', async () => {
      const invalidUser = new User({});
      let err: mongoose.Error.ValidationError | null = null;

      try {
        await invalidUser.validate();
      } catch (error) {
        err = error as mongoose.Error.ValidationError;
      }

      expect(err).toBeDefined();
      expect(err?.errors.name).toBeDefined();
      expect(err?.errors.email).toBeDefined();
      expect(err?.errors.passwordHash).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      await User.init(); // Ensure indexes are built
      await User.create({
        name: 'User One',
        email: 'unique@example.com',
        passwordHash: 'hash1',
      });

      let duplicateError: unknown = null;
      try {
        await User.create({
          name: 'User Two',
          email: 'unique@example.com',
          passwordHash: 'hash2',
        });
      } catch (error) {
        duplicateError = error;
      }

      expect(duplicateError).toBeDefined();
      // MongoDB duplicate key error code is 11000
      expect((duplicateError as { code?: number }).code).toBe(11000);
    });

    it('should safely serialize to JSON without exposing sensitive password and token fields', async () => {
      const user = await User.create({
        name: 'Secret User',
        email: 'secret@example.com',
        passwordHash: '$2b$10$supersecretpasswordhash',
        passwordResetTokenHash: 'hashedresettoken123',
        passwordResetExpires: new Date(Date.now() + 3600000),
      });

      const serialized = user.toJSON();

      expect(serialized.passwordHash).toBeUndefined();
      expect(serialized.passwordResetTokenHash).toBeUndefined();
      expect(serialized.passwordResetExpires).toBeUndefined();
      expect((serialized as { __v?: unknown }).__v).toBeUndefined();
      expect(serialized.email).toBe('secret@example.com');
      expect(serialized.name).toBe('Secret User');
    });
  });

  describe('Photo Model & Relationship Integrity', () => {
    it('should create and link a photo to a user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const photo = await Photo.create({
        userId,
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        publicId: 'echoes/photos/sample_123',
        format: 'jpg',
        width: 1920,
        height: 1080,
        bytes: 204800,
      });

      expect(photo._id).toBeDefined();
      expect(photo.userId.toString()).toBe(userId.toString());
      expect(photo.url).toBe('https://res.cloudinary.com/demo/image/upload/sample.jpg');
      expect(photo.publicId).toBe('echoes/photos/sample_123');
      expect(photo.memoryId).toBeNull();
    });

    it('should fail validation when required photo fields are missing', async () => {
      const invalidPhoto = new Photo({});
      let err: mongoose.Error.ValidationError | null = null;

      try {
        await invalidPhoto.validate();
      } catch (error) {
        err = error as mongoose.Error.ValidationError;
      }

      expect(err).toBeDefined();
      expect(err?.errors.userId).toBeDefined();
      expect(err?.errors.url).toBeDefined();
      expect(err?.errors.publicId).toBeDefined();
    });

    it('should unlink deleted photo from associated memory photos array', async () => {
      const userId = new mongoose.Types.ObjectId();
      const photo = await Photo.create({
        userId,
        url: 'https://example.com/p1.jpg',
        publicId: 'p1',
      });

      const memory = await Memory.create({
        userId,
        title: 'Memory with photo',
        content: 'Content',
        memoryDate: new Date(),
        photos: [photo._id],
      });

      photo.memoryId = memory._id;
      await photo.save();

      // Delete the photo via findOneAndDelete
      await Photo.findOneAndDelete({ _id: photo._id });

      const updatedMemory = await Memory.findById(memory._id);
      expect(updatedMemory?.photos).not.toContainEqual(photo._id);
    });

    it('should unlink deleted photo from associated memory when deleted via doc.deleteOne()', async () => {
      const userId = new mongoose.Types.ObjectId();
      const photo = await Photo.create({
        userId,
        url: 'https://example.com/p2.jpg',
        publicId: 'p2',
      });

      const memory = await Memory.create({
        userId,
        title: 'Memory with photo for doc delete',
        content: 'Content',
        memoryDate: new Date(),
        photos: [photo._id],
      });

      photo.memoryId = memory._id;
      await photo.save();

      // Delete the photo instance directly
      await photo.deleteOne();

      const updatedMemory = await Memory.findById(memory._id);
      expect(updatedMemory?.photos).not.toContainEqual(photo._id);
    });
  });

  describe('Memory Model & Reference Cleanup', () => {
    it('should create a memory referencing user and photos with tag normalization', async () => {
      const userId = new mongoose.Types.ObjectId();
      const photoId = new mongoose.Types.ObjectId();
      const memoryDate = new Date('2025-06-15T10:00:00Z');

      const memory = await Memory.create({
        userId,
        title: 'Graduation Day',
        content: 'An unforgettable milestone celebrated with mentors and family.',
        memoryDate,
        tags: ['College', 'GRADUATION ', 'Academics'],
        photos: [photoId],
      });

      expect(memory._id).toBeDefined();
      expect(memory.userId.toString()).toBe(userId.toString());
      expect(memory.title).toBe('Graduation Day');
      expect(memory.tags).toEqual(['college', 'graduation', 'academics']);
      expect(memory.photos).toHaveLength(1);
      expect(memory.photos[0].toString()).toBe(photoId.toString());
    });

    it('should fail validation when title, content or memoryDate are missing', async () => {
      const invalidMemory = new Memory({ userId: new mongoose.Types.ObjectId() });
      let err: mongoose.Error.ValidationError | null = null;

      try {
        await invalidMemory.validate();
      } catch (error) {
        err = error as mongoose.Error.ValidationError;
      }

      expect(err).toBeDefined();
      expect(err?.errors.title).toBeDefined();
      expect(err?.errors.content).toBeDefined();
      expect(err?.errors.memoryDate).toBeDefined();
    });

    it('should unlink associated photos when a memory is deleted via findOneAndDelete', async () => {
      const userId = new mongoose.Types.ObjectId();
      const memory = await Memory.create({
        userId,
        title: 'Memory to delete',
        content: 'Content',
        memoryDate: new Date(),
      });

      const photo = await Photo.create({
        userId,
        memoryId: memory._id,
        url: 'https://example.com/memphoto.jpg',
        publicId: 'memphoto1',
      });

      expect(photo.memoryId?.toString()).toBe(memory._id.toString());

      // Delete memory
      await Memory.findOneAndDelete({ _id: memory._id });

      const reloadedPhoto = await Photo.findById(photo._id);
      expect(reloadedPhoto?.memoryId).toBeNull();
    });

    it('should unlink associated photos when a memory is deleted via doc.deleteOne()', async () => {
      const userId = new mongoose.Types.ObjectId();
      const memory = await Memory.create({
        userId,
        title: 'Memory to delete via instance',
        content: 'Content',
        memoryDate: new Date(),
      });

      const photo = await Photo.create({
        userId,
        memoryId: memory._id,
        url: 'https://example.com/memphoto2.jpg',
        publicId: 'memphoto2',
      });

      expect(photo.memoryId?.toString()).toBe(memory._id.toString());

      // Delete memory instance directly
      await memory.deleteOne();

      const reloadedPhoto = await Photo.findById(photo._id);
      expect(reloadedPhoto?.memoryId).toBeNull();
    });
  });

  describe('TimeCapsule Model & Lock Invariants', () => {
    it('should create a locked time capsule with future unlock date, sealedAt and default flags', async () => {
      const userId = new mongoose.Types.ObjectId();
      const unlockDate = new Date('2030-01-01T00:00:00Z');

      const capsule = await TimeCapsule.create({
        userId,
        title: 'Letter to my 2030 Self',
        message: 'Reflect on where you started and what you wanted to achieve.',
        unlockDate,
        photoUrls: ['https://res.cloudinary.com/demo/image/upload/capsule1.jpg'],
      });

      expect(capsule._id).toBeDefined();
      expect(capsule.userId.toString()).toBe(userId.toString());
      expect(capsule.isOpened).toBe(false);
      expect(capsule.openedAt).toBeNull();
      expect(capsule.sealedAt).toBeDefined();
      expect(capsule.unlockDate.toISOString()).toBe(unlockDate.toISOString());
      // Test virtual alias unlockAt
      expect(capsule.unlockAt.toISOString()).toBe(unlockDate.toISOString());
    });

    it('should accurately evaluate isLocked independent of isOpened state', async () => {
      const userId = new mongoose.Types.ObjectId();
      const futureDate = new Date(Date.now() + 1000000);
      const pastDate = new Date(Date.now() - 1000000);

      const lockedCapsule = new TimeCapsule({
        userId,
        title: 'Locked Capsule',
        message: 'Content',
        unlockDate: futureDate,
        isOpened: false,
      });

      const unlockedCapsule = new TimeCapsule({
        userId,
        title: 'Past Capsule',
        message: 'Content',
        unlockDate: pastDate,
        isOpened: false, // isOpened is false, but unlock date has passed
      });

      // Locked capsule cannot be opened before unlockDate
      expect(lockedCapsule.isLocked()).toBe(true);

      // Past capsule is no longer locked regardless of whether user has marked isOpened
      expect(unlockedCapsule.isLocked()).toBe(false);
    });

    it('should fail validation when unlockDate or message are missing', async () => {
      const invalidCapsule = new TimeCapsule({
        userId: new mongoose.Types.ObjectId(),
        title: 'Missing Date Capsule',
      });
      let err: mongoose.Error.ValidationError | null = null;

      try {
        await invalidCapsule.validate();
      } catch (error) {
        err = error as mongoose.Error.ValidationError;
      }

      expect(err).toBeDefined();
      expect(err?.errors.message).toBeDefined();
      expect(err?.errors.unlockDate).toBeDefined();
    });
  });
});

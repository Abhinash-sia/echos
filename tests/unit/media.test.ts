import { describe, it, expect, afterEach } from 'vitest';
import {
  validateImageBuffer,
  generateSignedPhotoUrl,
  isValidObjectId,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/media/cloudinary';

describe('Media & Cloudinary Utilities Unit Tests', () => {
  describe('isValidObjectId', () => {
    it('should return true for valid 24-character hexadecimal MongoDB ObjectIds', () => {
      expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
      expect(isValidObjectId('000000000000000000000000')).toBe(true);
      expect(isValidObjectId('abcdefabcdefabcdefabcdef')).toBe(true);
    });

    it('should return false for invalid strings, wrong lengths, or non-hex characters', () => {
      expect(isValidObjectId('')).toBe(false);
      expect(isValidObjectId('12345')).toBe(false);
      expect(isValidObjectId('507f1f77bcf86cd79943901g')).toBe(false); // 'g' is not hex
      expect(isValidObjectId('507f1f77bcf86cd79943901122')).toBe(false); // too long
      expect(isValidObjectId('not-an-object-id')).toBe(false);
    });
  });

  describe('validateImageBuffer', () => {
    it('should accept valid JPEG buffer with correct magic bytes', () => {
      // JPEG magic bytes: FF D8 FF
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      ]);
      const result = validateImageBuffer(jpegBuffer, 'image/jpeg');
      expect(result.valid).toBe(true);
    });

    it('should accept valid PNG buffer with correct magic bytes', () => {
      // PNG magic bytes: 89 50 4E 47
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);
      const result = validateImageBuffer(pngBuffer, 'image/png');
      expect(result.valid).toBe(true);
    });

    it('should accept valid WebP buffer with correct magic bytes', () => {
      // RIFF .... WEBP
      const webpBuffer = Buffer.from('RIFF1234WEBPVP8 ');
      const result = validateImageBuffer(webpBuffer, 'image/webp');
      expect(result.valid).toBe(true);
    });

    it('should accept valid GIF buffer with correct magic bytes', () => {
      // GIF8
      const gifBuffer = Buffer.from('GIF89a123456');
      const result = validateImageBuffer(gifBuffer, 'image/gif');
      expect(result.valid).toBe(true);
    });

    it('should reject empty buffer', () => {
      const emptyBuffer = Buffer.alloc(0);
      const result = validateImageBuffer(emptyBuffer, 'image/jpeg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File is empty');
    });

    it('should reject oversized buffers exceeding 10MB', () => {
      const oversizedBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 10);
      // Valid JPEG header
      oversizedBuffer[0] = 0xff;
      oversizedBuffer[1] = 0xd8;
      oversizedBuffer[2] = 0xff;

      const result = validateImageBuffer(oversizedBuffer, 'image/jpeg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds the 10MB limit');
    });

    it('should reject unsupported MIME types', () => {
      const textBuffer = Buffer.from('Plain text content');
      const result = validateImageBuffer(textBuffer, 'text/plain');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported media type');
    });

    it('should reject buffers with spoofed MIME type but invalid magic bytes', () => {
      // Claiming image/jpeg but header is plain text
      const fakeBuffer = Buffer.from('NOT_A_REAL_JPEG_IMAGE_HEADER');
      const result = validateImageBuffer(fakeBuffer, 'image/jpeg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('magic bytes validation failed');
    });
  });

  describe('generateSignedPhotoUrl & Token Authentication', () => {
    const originalTokenKey = process.env.CLOUDINARY_AUTH_TOKEN_KEY;

    afterEach(() => {
      if (originalTokenKey === undefined) {
        delete process.env.CLOUDINARY_AUTH_TOKEN_KEY;
      } else {
        process.env.CLOUDINARY_AUTH_TOKEN_KEY = originalTokenKey;
      }
    });

    it('should generate a standard authenticated signed URL when CLOUDINARY_AUTH_TOKEN_KEY is unset', () => {
      delete process.env.CLOUDINARY_AUTH_TOKEN_KEY;
      const publicId = 'echoes/users/u123/memories/m456/sample_photo';
      const signedUrl = generateSignedPhotoUrl(publicId);

      expect(signedUrl).toContain('image/authenticated');
      expect(signedUrl).toMatch(/\/s--[A-Za-z0-9_-]+--\//);
      expect(signedUrl).not.toContain('__cld_token__=');
      expect(signedUrl).toContain(publicId);
    });

    it('should generate an authenticated URL containing __cld_token__ when CLOUDINARY_AUTH_TOKEN_KEY is set', () => {
      process.env.CLOUDINARY_AUTH_TOKEN_KEY = '0123456789abcdef0123456789abcdef';
      const publicId = 'echoes/users/u123/memories/m456/sample_photo';
      const beforeTime = Math.round(Date.now() / 1000) + 1800;
      const signedUrl = generateSignedPhotoUrl(publicId, { expiresInSeconds: 1800 });
      const afterTime = Math.round(Date.now() / 1000) + 1800;

      expect(signedUrl).toContain('image/authenticated');
      expect(signedUrl).toContain('__cld_token__=');
      expect(signedUrl).toContain(publicId);

      // Verify token structure: exp=<epoch>~hmac=<sha256>
      const match = signedUrl.match(/__cld_token__=exp=(\d+)~hmac=([0-9a-f]{64})/);
      expect(match).not.toBeNull();
      const exp = parseInt(match![1], 10);
      expect(exp).toBeGreaterThanOrEqual(beforeTime - 1);
      expect(exp).toBeLessThanOrEqual(afterTime + 1);
    });

    it('should default to 900 seconds (15 minutes) expiration in __cld_token__ when token key is set', () => {
      process.env.CLOUDINARY_AUTH_TOKEN_KEY = '0123456789abcdef0123456789abcdef';
      const publicId = 'echoes/users/u123/memories/m456/default_expiry';
      const beforeTime = Math.round(Date.now() / 1000) + 900;
      const signedUrl = generateSignedPhotoUrl(publicId);
      const afterTime = Math.round(Date.now() / 1000) + 900;

      const match = signedUrl.match(/__cld_token__=exp=(\d+)~hmac=([0-9a-f]{64})/);
      expect(match).not.toBeNull();
      const exp = parseInt(match![1], 10);
      expect(exp).toBeGreaterThanOrEqual(beforeTime - 1);
      expect(exp).toBeLessThanOrEqual(afterTime + 1);
    });

    it('should never expose Cloudinary credentials or token signing keys in the URL', () => {
      const publicId = 'echoes/users/u123/memories/m456/secret_test';
      const signedUrl = generateSignedPhotoUrl(publicId);

      // Verify secrets are not in query string or URL path
      expect(signedUrl).not.toContain('api_key');
      expect(signedUrl).not.toContain('api_secret');
      expect(signedUrl).not.toContain('mock-secret');
      expect(signedUrl).not.toContain('mock-key');
    });
  });
});

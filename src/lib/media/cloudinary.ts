import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import mongoose from 'mongoose';
import { getEnv } from '@/lib/env';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
}

export interface MockCloudinaryUploader {
  upload(buffer: Buffer, options: Record<string, unknown>): Promise<CloudinaryUploadResult>;
  destroy(publicId: string, options?: Record<string, unknown>): Promise<{ result: string }>;
}

let mockUploader: MockCloudinaryUploader | null = null;

export function setMockCloudinary(mock: MockCloudinaryUploader | null): void {
  mockUploader = mock;
}

export function resetMockCloudinary(): void {
  mockUploader = null;
}

/**
 * Ensures Cloudinary SDK is initialized with environment credentials.
 */
function ensureCloudinaryConfigured(): void {
  const env = getEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME || 'mock-cloud',
    api_key: env.CLOUDINARY_API_KEY || 'mock-key',
    api_secret: env.CLOUDINARY_API_SECRET || 'mock-secret',
    secure: true,
  });
}

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates file size, MIME type and binary magic bytes of an uploaded image buffer.
 */
export function validateImageBuffer(
  buffer: Buffer,
  mimeType: string
): { valid: boolean; error?: string } {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'File is empty.' };
  }
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10MB limit (size: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB).`,
    };
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported media type '${mimeType}'. Allowed formats: JPEG, PNG, WebP, GIF, AVIF.`,
    };
  }

  // Magic bytes inspection
  const header = buffer.subarray(0, 12);
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng =
    header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  const isGif =
    header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38;
  const isWebp =
    header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
  const isAvif =
    header.toString('ascii', 4, 8) === 'ftyp' &&
    (header.toString('ascii', 8, 12) === 'avif' || header.toString('ascii', 8, 12) === 'avis');

  if (!isJpeg && !isPng && !isGif && !isWebp && !isAvif) {
    return {
      valid: false,
      error:
        'File content does not match allowed image signatures (magic bytes validation failed).',
    };
  }

  return { valid: true };
}

/**
 * Uploads an image buffer to Cloudinary with authenticated delivery type for privacy.
 */
export async function uploadPhotoStream(
  buffer: Buffer,
  options: {
    folder: string;
    publicId: string;
    tags?: string[];
  }
): Promise<CloudinaryUploadResult> {
  if (mockUploader) {
    return mockUploader.upload(buffer, options);
  }

  ensureCloudinaryConfigured();

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: 'image',
        type: 'authenticated', // Private authenticated delivery
        tags: options.tags,
        overwrite: false,
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload returned undefined response'));
        }
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Default signed URL expiration: 15 minutes (900 seconds) for strict personal vault privacy.
 */
export const DEFAULT_PHOTO_URL_EXPIRY_SECONDS = 900;

/**
 * Deletes an image asset from Cloudinary.
 * Returns true if asset was successfully deleted or already absent ('not found').
 * Returns false on failure.
 */
export async function deleteCloudinaryPhoto(publicId: string): Promise<boolean> {
  if (mockUploader) {
    try {
      const res = await mockUploader.destroy(publicId);
      return res.result === 'ok' || res.result === 'not found';
    } catch {
      return false;
    }
  }

  ensureCloudinaryConfigured();

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      type: 'authenticated',
      invalidate: true,
    });
    return result.result === 'ok' || result.result === 'not found';
  } catch (error) {
    console.error(
      `[Cloudinary] Failed to destroy asset ${publicId}:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    return false;
  }
}

/**
 * Resolves the optional token-signing key for Cloudinary URL token authentication.
 * Returns null unless a valid 32-64 character hexadecimal CLOUDINARY_AUTH_TOKEN_KEY is configured,
 * allowing standard signed URLs (sign_url) to work on free-tier Cloudinary accounts.
 */
export function getAuthTokenKey(): string | null {
  const env = getEnv();
  if (env.CLOUDINARY_AUTH_TOKEN_KEY && /^[0-9a-fA-F]{32,64}$/.test(env.CLOUDINARY_AUTH_TOKEN_KEY)) {
    return env.CLOUDINARY_AUTH_TOKEN_KEY;
  }
  return null;
}

/**
 * Generates an authenticated signed URL for private photographs (`type: 'authenticated'`).
 *
 * When CLOUDINARY_AUTH_TOKEN_KEY is configured, attaches Cloudinary's time-limited `__cld_token__`
 * authentication parameter. Otherwise, generates a standard HMAC-signed URL (`sign_url: true`)
 * compatible with all Cloudinary plans while keeping unsigned access blocked.
 *
 * @param publicId Cloudinary asset public ID.
 * @param options Expiration duration (defaults to 900s / 15 mins when token auth is enabled) and optional format override.
 * @returns Signed delivery URL for the private Cloudinary asset.
 */
export function generateSignedPhotoUrl(
  publicId: string,
  options: { expiresInSeconds?: number; format?: string } = {}
): string {
  const duration = options.expiresInSeconds || DEFAULT_PHOTO_URL_EXPIRY_SECONDS;
  const tokenKey = getAuthTokenKey();

  ensureCloudinaryConfigured();

  return cloudinary.url(publicId, {
    type: 'authenticated',
    sign_url: true,
    secure: true,
    format: options.format,
    ...(tokenKey
      ? {
          auth_token: {
            key: tokenKey,
            duration,
          },
        }
      : {}),
  });
}

/**
 * Validates 24-character hexadecimal MongoDB ObjectIds.
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);
}

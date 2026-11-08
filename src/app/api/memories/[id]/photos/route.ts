import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { authenticateRequest } from '@/lib/auth/guard';
import { connectToDatabase } from '@/lib/db';
import { Memory } from '@/models/Memory';
import { Photo } from '@/models/Photo';
import {
  isValidObjectId,
  validateImageBuffer,
  uploadPhotoStream,
  deleteCloudinaryPhoto,
  generateSignedPhotoUrl,
} from '@/lib/media/cloudinary';

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

/**
 * POST /api/memories/:id/photos
 * Uploads a photograph to Cloudinary and associates it with the specified memory.
 * Implements compensating rollback if database insertion fails after Cloudinary upload.
 */
export async function POST(request: Request, context: RouteContext) {
  let uploadedPublicId: string | null = null;

  try {
    try {
      await headers();
    } catch {
      // Test environment fallback
    }

    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await Promise.resolve(context.params);
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid memory ID format.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify memory ownership
    const memory = await Memory.findOne({
      _id: id,
      userId: auth.user._id,
    });

    if (!memory) {
      return NextResponse.json(
        { success: false, error: 'Memory not found or access denied.' },
        { status: 404 }
      );
    }

    // Parse multipart/form-data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed multipart form data.' },
        { status: 400 }
      );
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, error: "A valid photo file must be provided in the 'file' field." },
        { status: 400 }
      );
    }

    const fileBlob = file as File;
    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate size, MIME type, and binary magic bytes
    const validation = validateImageBuffer(buffer, fileBlob.type);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Generate safe, scoped resource identifier
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const folder = `echoes/users/${auth.user._id.toString()}/memories/${memory._id.toString()}`;
    const publicId = `${folder}/${uniqueSuffix}`;

    // Upload to Cloudinary with authenticated privacy
    let uploadResult;
    try {
      uploadResult = await uploadPhotoStream(buffer, {
        folder,
        publicId,
        tags: ['echoes', 'memory_photo'],
      });
      uploadedPublicId = uploadResult.public_id;
    } catch (uploadError) {
      console.error(
        '[Cloudinary Upload Error]:',
        uploadError instanceof Error ? uploadError.message : 'Unknown error'
      );
      return NextResponse.json(
        { success: false, error: 'Failed to upload photo to storage provider.' },
        { status: 502 }
      );
    }

    // Save Photo document and update Memory reference
    let savedPhoto;
    try {
      savedPhoto = await Photo.create({
        userId: auth.user._id,
        memoryId: memory._id,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
      });

      await Memory.findByIdAndUpdate(memory._id, {
        $addToSet: { photos: savedPhoto._id },
      });
    } catch (dbError) {
      console.error(
        '[Database Error after Cloudinary Upload]:',
        dbError instanceof Error ? dbError.message : 'Unknown error'
      );
      // Compensating rollback: delete orphaned Cloudinary asset
      if (uploadedPublicId) {
        await deleteCloudinaryPhoto(uploadedPublicId).catch((rollbackErr) => {
          console.error(
            '[Compensating Cleanup Failed]:',
            rollbackErr instanceof Error ? rollbackErr.message : 'Unknown error'
          );
        });
      }
      return NextResponse.json(
        { success: false, error: 'Database persistence failed after media upload.' },
        { status: 500 }
      );
    }

    const photoObj = savedPhoto.toObject();
    const photoWithSignedUrl = {
      ...photoObj,
      signedUrl: generateSignedPhotoUrl(savedPhoto.publicId),
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Photo uploaded and attached successfully.',
        data: photoWithSignedUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      '[Memory Photos POST] Unhandled error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    // Compensating cleanup if unhandled exception occurs
    if (uploadedPublicId) {
      await deleteCloudinaryPhoto(uploadedPublicId).catch(() => {});
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while uploading photo.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/memories/:id/photos
 * Retrieves all photographs belonging to a memory, mapped with fresh signed delivery URLs.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    try {
      await headers();
    } catch {
      // Test environment fallback
    }

    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await Promise.resolve(context.params);
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid memory ID format.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify memory ownership
    const memory = await Memory.findOne({
      _id: id,
      userId: auth.user._id,
    });

    if (!memory) {
      return NextResponse.json(
        { success: false, error: 'Memory not found or access denied.' },
        { status: 404 }
      );
    }

    const photos = await Photo.find({
      memoryId: memory._id,
      userId: auth.user._id,
    }).lean();

    const photosWithSignedUrls = photos.map((photo) => ({
      ...photo,
      signedUrl: generateSignedPhotoUrl(photo.publicId),
    }));

    return NextResponse.json({ success: true, data: photosWithSignedUrls }, { status: 200 });
  } catch (error) {
    console.error('[Memory Photos GET] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while retrieving photos.' },
      { status: 500 }
    );
  }
}

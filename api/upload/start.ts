import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { generateUploadUrl, validateAudioFile } from '@/lib/storage';

interface UploadRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  clientName?: string;
  clientEmail?: string;
}

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json() as UploadRequest;
    
    // Validate request
    if (!body.fileName || !body.fileType || !body.fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileType, fileSize' },
        { status: 400 }
      );
    }

    // Validate audio file
    const validationError = validateAudioFile(body.fileType, body.fileSize);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Generate presigned URL
    const uploadResult = await generateUploadUrl(body.fileName, body.fileType);

    console.log(`Upload URL generated for user ${user.email}: ${body.fileName} (${body.fileSize} bytes)`);

    return NextResponse.json({
      success: true,
      uploadUrl: uploadResult.uploadUrl,
      fileKey: uploadResult.fileKey,
      maxFileSize: uploadResult.maxFileSize,
      expiresIn: 3600, // 1 hour
      instructions: {
        method: 'PUT',
        headers: {
          'Content-Type': body.fileType,
        },
        maxRetries: 3,
      },
      nextSteps: {
        transcribe: `/api/transcribe`,
        generateQuote: `/api/quote/generate`,
      },
    });

  } catch (error) {
    console.error('Upload start error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// Also support GET for upload info/limits
export const GET = withAuth(async (request: NextRequest, { user }) => {
  return NextResponse.json({
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedFormats: [
      'audio/mpeg',
      'audio/mp3', 
      'audio/wav',
      'audio/m4a',
      'audio/aac',
      'audio/ogg',
      'audio/webm',
    ],
    maxDurationMinutes: 30,
    pricing: {
      transcription: '$0.006 per minute',
      quoteGeneration: '$0.50 per quote',
    },
    instructions: [
      '1. Record your property walkthrough (up to 30 minutes)',
      '2. Upload the audio file using the provided URL',
      '3. Wait for transcription (usually 1-3 minutes)',
      '4. Review and approve the generated quote',
      '5. Send to client with payment link',
    ],
  });
});
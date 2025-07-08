import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { transcribeWithRetry } from '@/lib/transcription';

interface TranscriptionRequest {
  fileKey: string;
  language?: string;
  clientContext?: string;
}

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json() as TranscriptionRequest;
    
    if (!body.fileKey) {
      return NextResponse.json(
        { error: 'fileKey is required' },
        { status: 400 }
      );
    }

    console.log(`Starting transcription for user ${user.email}, file: ${body.fileKey}`);

    // Start transcription with retry logic
    const result = await transcribeWithRetry(body.fileKey, {
      language: body.language || 'en',
      prompt: body.clientContext || 'This is a property walkthrough recording. The speaker is describing maintenance issues, repairs needed, and property conditions.',
      response_format: 'verbose_json',
    });

    console.log(`Transcription completed for ${body.fileKey}: ${result.text.length} characters`);

    return NextResponse.json({
      success: true,
      transcription: {
        text: result.text,
        duration: result.duration,
        language: result.language,
        wordCount: result.text.split(/\s+/).length,
        characterCount: result.text.length,
      },
      fileKey: body.fileKey,
      nextSteps: {
        generateQuote: `/api/quote/generate`,
        retranscribe: `/api/transcribe`,
      },
      usage: {
        estimatedCost: result.duration ? (result.duration / 60) * 0.006 : null,
        processingTimeSeconds: null, // Could track this
      },
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { 
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      },
      { status: 500 }
    );
  }
});

// GET endpoint to check transcription status (for future async processing)
export const GET = withAuth(async (request: NextRequest, { user }) => {
  const { searchParams } = new URL(request.url);
  const fileKey = searchParams.get('fileKey');
  
  if (!fileKey) {
    return NextResponse.json(
      { error: 'fileKey parameter is required' },
      { status: 400 }
    );
  }

  // For now, we only do synchronous transcription
  // In the future, this could check the status of an async job
  return NextResponse.json({
    status: 'not_started',
    message: 'Use POST method to start transcription',
    fileKey,
  });
});
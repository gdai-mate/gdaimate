import OpenAI from 'openai';
import { env } from './env';
import { getFileStream } from './storage';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export interface TranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
  confidence?: number;
}

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
  response_format?: 'text' | 'json' | 'verbose_json';
}

export const transcribeAudio = async (
  fileKey: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> => {
  try {
    console.log(`Starting transcription for file: ${fileKey}`);
    
    // Get the audio file from R2
    const audioStream = await getFileStream(fileKey);
    
    if (!audioStream) {
      throw new Error('Could not retrieve audio file from storage');
    }

    // Convert stream to File-like object for OpenAI
    const audioBuffer = await streamToBuffer(audioStream);
    
    // Create a File-like object
    const audioFile = new File([audioBuffer], fileKey, {
      type: 'audio/mpeg', // OpenAI will auto-detect the actual format
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: options.language || 'en',
      prompt: options.prompt || 'This is a property walkthrough audio recording. Please transcribe accurately.',
      temperature: options.temperature || 0,
      response_format: options.response_format || 'verbose_json',
    });

    if (typeof transcription === 'string') {
      return { text: transcription };
    }

    console.log(`Transcription completed for ${fileKey}. Length: ${transcription.text.length} characters`);

    return {
      text: transcription.text,
      duration: transcription.duration,
      language: transcription.language,
    };
  } catch (error) {
    console.error('Transcription failed:', error);
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const transcribeWithRetry = async (
  fileKey: string,
  options: TranscriptionOptions = {},
  maxRetries: number = 3
): Promise<TranscriptionResult> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Transcription attempt ${attempt}/${maxRetries} for ${fileKey}`);
      return await transcribeAudio(fileKey, options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Transcription attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};

// Helper function to convert stream to buffer
async function streamToBuffer(stream: any): Promise<Buffer> {
  if (stream instanceof Buffer) {
    return stream;
  }

  const chunks: Uint8Array[] = [];
  
  if (stream[Symbol.asyncIterator]) {
    // Handle async iterable streams
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
  } else if (stream.read) {
    // Handle readable streams
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  } else {
    throw new Error('Unsupported stream type');
  }

  return Buffer.concat(chunks);
}

export const estimateTranscriptionCost = (durationMinutes: number): number => {
  // OpenAI Whisper pricing: $0.006 per minute
  return durationMinutes * 0.006;
};
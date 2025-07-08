import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export interface UploadConfig {
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
  expiresIn: number; // in seconds
}

const AUDIO_CONFIG: UploadConfig = {
  maxFileSize: 500 * 1024 * 1024, // 500MB - enough for 30min audio
  allowedMimeTypes: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/m4a',
    'audio/aac',
    'audio/ogg',
    'audio/webm',
  ],
  expiresIn: 3600, // 1 hour
};

export const generateUploadUrl = async (
  fileName: string,
  fileType: string,
  config: UploadConfig = AUDIO_CONFIG
): Promise<{
  uploadUrl: string;
  fileKey: string;
  maxFileSize: number;
}> => {
  if (!config.allowedMimeTypes.includes(fileType)) {
    throw new Error(`File type ${fileType} not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`);
  }

  const timestamp = Date.now();
  const fileExtension = fileName.split('.').pop() || 'bin';
  const fileKey = `audio/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
    ContentLength: config.maxFileSize,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: config.expiresIn,
  });

  return {
    uploadUrl,
    fileKey,
    maxFileSize: config.maxFileSize,
  };
};

export const getFileStream = async (fileKey: string) => {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: fileKey,
  });

  const response = await s3Client.send(command);
  return response.Body;
};

export const getFileUrl = async (fileKey: string, expiresIn: number = 3600) => {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: fileKey,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

export const validateAudioFile = (fileType: string, fileSize: number): string | null => {
  if (!AUDIO_CONFIG.allowedMimeTypes.includes(fileType)) {
    return `File type not supported. Supported types: ${AUDIO_CONFIG.allowedMimeTypes.join(', ')}`;
  }

  if (fileSize > AUDIO_CONFIG.maxFileSize) {
    return `File too large. Maximum size: ${AUDIO_CONFIG.maxFileSize / (1024 * 1024)}MB`;
  }

  return null; // Valid
};
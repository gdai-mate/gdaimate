import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  STRIPE_SECRET_KEY: z.string().min(1, 'Stripe secret key is required'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'Stripe publishable key is required'),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().min(1, 'Anthropic API key is required'),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key is required'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'Clerk publishable key is required'),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2 access key is required'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2 secret key is required'),
  R2_BUCKET_NAME: z.string().min(1, 'R2 bucket name is required'),
  R2_ENDPOINT: z.string().min(1, 'R2 endpoint is required'),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().min(1, 'Google service account email is required'),
  GOOGLE_PRIVATE_KEY: z.string().min(1, 'Google private key is required'),
  GOOGLE_SHEET_ID: z.string().min(1, 'Google Sheet ID is required'),
  TWILIO_SID: z.string().optional(),
  TWILIO_TOKEN: z.string().optional(),
  ALERT_PHONE: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
      throw new Error(
        `Environment validation failed. Missing or invalid variables:\n${missingVars}`
      );
    }
    throw error;
  }
}

export const env = validateEnv();

export const getSecureEnvForLogging = () => ({
  NODE_ENV: env.NODE_ENV,
  STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY ? '***REDACTED***' : undefined,
  STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET ? '***REDACTED***' : undefined,
  ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY ? '***REDACTED***' : undefined,
  OPENAI_API_KEY: env.OPENAI_API_KEY ? '***REDACTED***' : undefined,
  CLERK_SECRET_KEY: env.CLERK_SECRET_KEY ? '***REDACTED***' : undefined,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID ? '***REDACTED***' : undefined,
  R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY ? '***REDACTED***' : undefined,
  R2_BUCKET_NAME: env.R2_BUCKET_NAME,
  R2_ENDPOINT: env.R2_ENDPOINT,
  GOOGLE_SERVICE_ACCOUNT_EMAIL: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY: env.GOOGLE_PRIVATE_KEY ? '***REDACTED***' : undefined,
  GOOGLE_SHEET_ID: env.GOOGLE_SHEET_ID,
  TWILIO_SID: env.TWILIO_SID ? '***REDACTED***' : undefined,
  TWILIO_TOKEN: env.TWILIO_TOKEN ? '***REDACTED***' : undefined,
  ALERT_PHONE: env.ALERT_PHONE,
});
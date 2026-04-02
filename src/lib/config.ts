import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional().or(z.literal('')),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

// Explicitly mapping variables because process.env as an object is not available in the browser
const envVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NODE_ENV: process.env.NODE_ENV,
};

const _env = envSchema.safeParse(envVars);

if (!_env.success) {
  // Only log detailed errors in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Invalid environment variables:', _env.error.flatten().fieldErrors);
  }
  
  // In production, we want a hard crash to prevent undefined behavior
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment variables: MISSING CRITICAL CONFIG');
  }
}

export const env = _env.success ? _env.data : (envVars as unknown as z.infer<typeof envSchema>);

export const isProd = env.NODE_ENV === 'production';


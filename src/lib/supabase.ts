import { createClient } from '@supabase/supabase-js'
import { env } from './config'

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use as 'export const' for easier accessibility elsewhere
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// supabaseAdmin creation, use service_role only in Node environment
const isServer = typeof window === 'undefined';
export const supabaseAdmin = isServer 
  ? createClient(
      supabaseUrl,
      env.SUPABASE_SERVICE_ROLE_KEY || 'MISSING_SERVICE_ROLE_KEY',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null; // Never use admin on client
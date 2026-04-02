import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase admin environment variables are missing. This is expected during some build phases on Vercel.')
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jmyhckenewmkobirlgcj.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'no-key-placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
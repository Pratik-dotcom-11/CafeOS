import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fsdcbcizoxnbuqvtwcim.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZGNiY2l6b3huYnVxdnR3Y2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyNjQ2ODIsImV4cCI6MjEwOTg0MDY4Mn0.u7JMySjObjnurdftwhYSlUwkJ1CREKL4h7j_gKFUfZc';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[CafeOS Supabase] Warning: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Live cloud features may be unavailable.'
  );
}

/**
 * Strongly-typed Supabase client for CafeOS multi-tenant architecture.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;


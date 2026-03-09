import { createClient } from '@supabase/supabase-js';

// Client for use in browser/frontend — uses anon key only
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
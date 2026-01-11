import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PROJECT_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!PROJECT_URL || !PROJECT_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(PROJECT_URL, PROJECT_KEY);
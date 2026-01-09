import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = 'https://wxmwneumvsxkensiwnnl.supabase.co';
const PROJECT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4bXduZXVtdnN4a2Vuc2l3bm5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDkyOTEsImV4cCI6MjA4MzA4NTI5MX0.s2B9SQ6WgBfajFrwPAhshkewQnXkBB2DIH0Vh_43HGs';

export const supabase = createClient(PROJECT_URL, PROJECT_KEY);
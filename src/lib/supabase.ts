import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zxkcyptcqbyxutbudeum.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a2N5cHRjcWJ5eHV0YnVkZXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDkwMjEsImV4cCI6MjA5MzM4NTAyMX0.xPeQl848ywcBF8QszRxjCTHFw-oxr1pHd8ZlUk7QTHI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

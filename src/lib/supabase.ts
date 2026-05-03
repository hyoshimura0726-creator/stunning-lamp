import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zxkcyplcqbyxutbudeum.supabase.co';
const supabaseAnonKey = 'sb_publishable_6c1eOKbxyHUT0CRTSm0Rfw_-_lCwViM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

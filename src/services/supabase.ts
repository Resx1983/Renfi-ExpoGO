import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://gcvxltbcrkfdmhxucwlb.supabase.co';
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  'sb_publishable_X0lL4c1VLIOI5emtly9z1g_Ag-Yhu7k';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

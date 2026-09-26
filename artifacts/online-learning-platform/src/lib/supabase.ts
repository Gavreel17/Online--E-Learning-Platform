import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mnsyymgvuglyyelttlav.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_jUjq-A3TphIch-dJRWSk_Q_gHOw8Xx9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseHealth {
  connected: boolean;
  url: string;
  timestamp: string;
}

export async function checkSupabaseConnection(): Promise<SupabaseHealth> {
  try {
    const { data, error } = await supabase.from('subjects').select('count', { count: 'exact', head: true });
    return {
      connected: !error,
      url: supabaseUrl,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      connected: false,
      url: supabaseUrl,
      timestamp: new Date().toISOString(),
    };
  }
}

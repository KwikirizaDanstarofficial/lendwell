import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export async function getElectronSupabase(): Promise<SupabaseClient> {
  if (supabase) return supabase;

  const config = await window.electron.getConfig();

  supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  await supabase.auth.setSession({
    access_token: config.accessToken,
    refresh_token: config.refreshToken,
  });

  return supabase;
}

export function resetElectronSupabase(): void {
  supabase = null;
}

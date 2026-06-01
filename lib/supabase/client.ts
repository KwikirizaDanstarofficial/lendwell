import { createBrowserClient } from "@supabase/ssr"
import { getClientConfig } from "@/lib/client-config"

// Lazy singleton — created on first access so config is available in both
// SSR (reads process.env) and browser (reads window.__CONFIG__).
let _client: ReturnType<typeof createBrowserClient> | null = null

function getClient() {
  if (!_client) {
    const { supabaseUrl, supabaseAnonKey } = getClientConfig()
    _client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return _client
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_, prop: string) {
    return getClient()[prop as keyof ReturnType<typeof createBrowserClient>]
  },
})

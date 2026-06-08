import { createBrowserClient } from "@supabase/ssr"
import { getClientConfig } from "@/lib/client-config"

let _client: ReturnType<typeof createBrowserClient> | null = null

function getClient() {
  if (!_client) {
    const { supabaseUrl, supabaseAnonKey } = getClientConfig()
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase not configured — please log in first.")
    }
    _client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return _client
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_, prop: string) {
    return getClient()[prop as keyof ReturnType<typeof createBrowserClient>]
  },
})

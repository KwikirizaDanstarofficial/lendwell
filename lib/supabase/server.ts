/**
 * server.ts  (Supabase server-side clients)
 *
 * Provides two Supabase client factories for server-side use:
 *
 *  1. createSupabaseServerClient()  – SSR-aware client for Server Components
 *     and Route Handlers.  Session cookies are read/written automatically via
 *     Next.js `cookies()`.  RLS is enforced using the user's access token.
 *
 *  2. supabaseAdmin  – Singleton admin client that uses the service-role key.
 *     RLS is bypassed.  NEVER expose this client to the browser or pass it
 *     to Client Components.  Use only in trusted server-side logic.
 */

import { createClient }       from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies }            from "next/headers"

// ─── Environment variables ────────────────────────────────────────────────────

/** Supabase project URL. */
const SUPABASE_URL              = process.env.SUPABASE_URL!

/** Anon key — used for the SSR client (RLS enforced). */
const SUPABASE_ANON_KEY         = process.env.SUPABASE_ANON_KEY!

/** Service-role key — bypasses RLS; never expose to the browser. */
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── SSR client factory ───────────────────────────────────────────────────────

/**
 * Create an SSR-capable Supabase client for use in Server Components and
 * Route Handlers.
 *
 * Session cookies are automatically read from and written to the Next.js
 * cookie store, so the user's auth state is preserved across requests.
 *
 * @returns A `SupabaseClient` instance configured for server-side rendering.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Cookie writes may fail in read-only rendering contexts — safe to ignore
        }
      },
    },
  })
}

// ─── Admin client (singleton) ─────────────────────────────────────────────────

/**
 * Singleton Supabase admin client using the service-role key.
 *
 * ⚠️  RLS is bypassed — use sparingly and never in client-facing code.
 * Token refresh and session persistence are disabled because server-side
 * admin operations do not require them.
 */
// Placeholder fallbacks so createClient doesn't throw during Next.js static
// build on CI where env vars are not set. Real calls will fail at network
// level (caught by try/catch in pages) — the client itself never crashes.
export const supabaseAdmin = createClient(
  SUPABASE_URL || "http://localhost:54321",
  SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key",
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED FUNCTIONS / VALUES:
//   createSupabaseServerClient()  – SSR client (RLS enforced, cookie-aware)
//   supabaseAdmin                 – admin client (RLS bypassed, service-role key)
//
// ENVIRONMENT VARIABLES:
//   NEXT_PUBLIC_SUPABASE_URL       – Supabase project URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY  – public anon key (SSR client)
//   SUPABASE_SERVICE_ROLE_KEY      – service-role key (admin client only)
//
// RELATED FILES:
//   lib/supabase/client.ts  – browser-side anon client
//   lib/auth.ts             – uses createSupabaseServerClient for session reads

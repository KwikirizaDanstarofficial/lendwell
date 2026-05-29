/**
 * client.ts  (Supabase browser client)
 *
 * A singleton Supabase client created with the **anon key** so it respects
 * Row-Level Security policies.
 *
 * Use this client in Client Components (`"use client"`).
 * For Server Components and Route Handlers use
 * `@/lib/supabase/server#createSupabaseServerClient` instead.
 */

import { createClient } from "@supabase/supabase-js"

// ─── Environment variables ────────────────────────────────────────────────────

/** Public Supabase project URL (safe to expose to the browser). */
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!

/** Public anon key — Row-Level Security enforced; safe to expose to the browser. */
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── Singleton client ─────────────────────────────────────────────────────────

/**
 * Browser-side Supabase client.
 * RLS is enforced — the current session's access token is used implicitly.
 * Import this constant in any Client Component that needs direct DB access.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED VALUES:
//   supabase  – singleton SupabaseClient (anon key, RLS enforced)
//
// ENVIRONMENT VARIABLES:
//   NEXT_PUBLIC_SUPABASE_URL       – Supabase project URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY  – public anon key
//
// RELATED FILES:
//   lib/supabase/server.ts  – server-side clients (SSR + admin / service-role)

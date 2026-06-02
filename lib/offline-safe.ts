/**
 * Returns true when an error is a network/fetch failure rather than an
 * HTTP-level error from Supabase (constraint violation, auth error, etc.).
 *
 * Distinguishes by message pattern:
 * - Network errors:   "TypeError: fetch failed", "Failed to fetch", etc.
 * - Supabase errors:  have a PostgreSQL `code` (e.g. "23502") — NOT network errors
 */
export function isOfflineError(err: unknown): boolean {
  if (!err) return false
  const e = err as any

  // Node.js network error codes (thrown exceptions)
  if (e.code === "ECONNREFUSED" || e.code === "ENOTFOUND" || e.code === "ECONNRESET") return true

  // If it has a Postgres/PostgREST error code it's a real API error, not offline
  if (typeof e.code === "string" && e.code.length > 0) return false

  // Check message for fetch/network failure strings
  if (typeof e.message === "string") {
    const msg = e.message.toLowerCase()
    if (
      msg.includes("fetch failed") ||
      msg.includes("failed to fetch") ||
      msg.includes("typeerror: fetch") ||
      msg.includes("networkerror") ||
      msg.includes("econnrefused") ||
      msg.includes("enotfound")
    ) return true
  }

  return false
}

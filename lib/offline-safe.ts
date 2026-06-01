/**
 * Returns true when an error is a network/fetch failure rather than an
 * HTTP-level error from Supabase (401, 403, 422, etc.).
 *
 * Supabase errors from the REST API always include a numeric `status` field.
 * When the device is offline the fetch itself fails (no HTTP response), so
 * `status` is undefined / 0.
 */
export function isOfflineError(err: unknown): boolean {
  if (!err) return false
  const e = err as any
  // No HTTP status → network unreachable
  if (!e.status) return true
  // Node fetch errors
  if (e.code === "ECONNREFUSED" || e.code === "ENOTFOUND" || e.code === "ECONNRESET") return true
  // Browser / Electron fetch errors
  if (typeof e.message === "string") {
    const msg = e.message.toLowerCase()
    if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("fetch")) return true
  }
  return false
}

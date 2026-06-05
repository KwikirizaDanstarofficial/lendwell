"use client"

/**
 * Fetches SACCO settings for PDF generation.
 * Returns an empty object when offline or on any network error so PDF
 * generation can still proceed with fallback text.
 */
export async function fetchSaccoSettings(): Promise<Record<string, any>> {
  try {
    const res = await fetch("/api/settings")
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}

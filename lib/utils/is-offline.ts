/**
 * Returns true when the device has no internet connectivity.
 *
 * In Electron, navigator.onLine is unreliable — it can report false even
 * when the network is up. We prefer the preload-exposed net.isOnline() which
 * uses an OS-level connectivity check when available.
 *
 * Never throws — any failure in the Electron bridge falls back to
 * navigator.onLine so the app keeps running rather than crashing.
 */
export function isOffline(): boolean {
  if (typeof window === "undefined") return false

  try {
    const electron = (window as any).electronApp
    if (electron && typeof electron.isOnline === "function") {
      return !electron.isOnline()
    }
  } catch {
    // Electron bridge threw (e.g. sandboxed preload) — fall through
  }

  return typeof navigator !== "undefined" && !navigator.onLine
}

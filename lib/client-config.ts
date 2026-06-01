/**
 * Safe config bridge.
 *
 * Server-side: reads from process.env (never exposed to the browser).
 * Browser:     reads from window.__CONFIG__ injected by app/layout.tsx.
 *
 * No NEXT_PUBLIC_ vars are used, so nothing is baked into the JS bundle.
 */

export interface ClientConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  powersyncUrl: string
  flwPublicKey: string
  appUrl: string
  saccoName: string
}

declare global {
  interface Window {
    __CONFIG__: ClientConfig
  }
}

export function getClientConfig(): ClientConfig {
  if (typeof window === "undefined") {
    // SSR path — process.env is available on the server
    return {
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
      powersyncUrl: process.env.POWERSYNC_URL ?? "",
      flwPublicKey: process.env.FLW_PUBLIC_KEY ?? "",
      appUrl: process.env.APP_URL ?? "",
      saccoName: process.env.SACCO_NAME ?? "My SACCO",
    }
  }
  // Browser path — injected by root layout before hydration
  return window.__CONFIG__
}

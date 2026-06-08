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

const EMPTY_CONFIG: ClientConfig = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  powersyncUrl: "",
  flwPublicKey: "",
  appUrl: "",
  saccoName: "My SACCO",
}

export function getClientConfig(): ClientConfig {
  if (typeof window === "undefined") {
    return {
      supabaseUrl: process.env.SUPABASE_URL ?? "",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
      powersyncUrl: process.env.POWERSYNC_URL ?? "",
      flwPublicKey: process.env.FLW_PUBLIC_KEY ?? "",
      appUrl: process.env.APP_URL ?? "",
      saccoName: process.env.SACCO_NAME ?? "My SACCO",
    }
  }

  // Electron: config comes from vault via IPC
  if (window.electron) {
    return window.__CONFIG__ ?? EMPTY_CONFIG
  }

  return window.__CONFIG__ ?? EMPTY_CONFIG
}

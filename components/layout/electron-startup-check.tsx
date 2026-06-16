"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { PageLoader } from "@/components/ui/page-loader"

const PUBLIC_PATHS = ["/auth/login", "/auth/signup", "/auth/reset-password", "/electron/login"]
const LS_SESSION_KEY = "lendwell-session"

function saveSessionToLs(accessToken: string, refreshToken: string) {
  try { localStorage.setItem(LS_SESSION_KEY, JSON.stringify({ accessToken, refreshToken, savedAt: Date.now() })) } catch {}
}

function loadSessionFromLs(): { accessToken: string; refreshToken: string } | null {
  try {
    const raw = localStorage.getItem(LS_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.accessToken && parsed?.refreshToken) return parsed
    return null
  } catch { return null }
}

export function ElectronStartupCheck() {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      const isElectron = typeof window !== "undefined" && "electron" in window
      if (!isElectron) {
        setChecking(false)
        return
      }

      let accessToken: string | null = null
      let refreshToken: string | null = null

      try {
        // 1. Try Electron vault first
        const hasVault = await window.electron.vaultExists()
        if (hasVault) {
          const config = await window.electron.getConfig()
          accessToken = config.accessToken ?? null
          refreshToken = config.refreshToken ?? null
        }
      } catch {
        // vault unavailable
      }

      // 2. Fallback to localStorage
      if (!accessToken || !refreshToken) {
        const ls = loadSessionFromLs()
        if (ls) {
          accessToken = ls.accessToken
          refreshToken = ls.refreshToken
        }
      }

      if (!accessToken || !refreshToken) {
        if (!PUBLIC_PATHS.includes(pathname)) router.push("/auth/login")
        setChecking(false)
        return
      }

      // 3. Try to restore SSR cookies — this may fail when offline
      let restored = false
      try {
        const res = await fetch("/api/auth/restore-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, refreshToken }),
        })
        restored = res.ok
      } catch {
        // network error — offline
      }

      // 4. Keep localStorage in sync with vault
      saveSessionToLs(accessToken, refreshToken)

      // 5. Restore Supabase client session from localStorage even if SSR fails
      if (!restored) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session || !session.access_token) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          }
        } catch {
          // can't set session offline
        }
      }

      // 6. Navigate to dashboard if on login/root, even when offline
      if (pathname === "/auth/login" || pathname === "/") {
        router.push("/dashboard")
        return
      }

      setChecking(false)
    }
    check()
  }, [router, pathname])

  if (checking) return <PageLoader />
  return null
}

"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { PageLoader } from "@/components/ui/page-loader"

const PUBLIC_PATHS = ["/auth/login", "/auth/signup", "/auth/reset-password", "/electron/login"]

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

      try {
        const hasVault = await window.electron.vaultExists()

        if (!hasVault && !PUBLIC_PATHS.includes(pathname)) {
          router.push("/auth/login")
          return
        }

        if (!hasVault) {
          setChecking(false)
          return
        }

        const config = await window.electron.getConfig()
        const hasSession = !!(config.accessToken && config.refreshToken)

        if (!hasSession) {
          setChecking(false)
          return
        }

        // Restore SSR cookies from vault tokens
        let restored = false
        try {
          const res = await fetch("/api/auth/restore-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken: config.accessToken,
              refreshToken: config.refreshToken ?? config.accessToken,
            }),
          })
          restored = res.ok
        } catch {
          // Network error — session restoration failed
        }

        if (!restored) {
          if (!PUBLIC_PATHS.includes(pathname)) {
            router.push("/auth/login")
          }
          setChecking(false)
          return
        }

        if (pathname === "/auth/login" || pathname === "/") {
          router.push("/dashboard")
        }
      } catch {
        // Electron bridge error — assume web mode
      }
      setChecking(false)
    }
    check()
  }, [router, pathname])

  if (checking) {
    return <PageLoader />
  }

  return null
}

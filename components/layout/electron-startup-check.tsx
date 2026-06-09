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
        let hasSession = false
        if (hasVault) {
          const config = await window.electron.getConfig()
          hasSession = !!(config.accessToken && config.refreshToken)
        }
        if (!hasVault && !PUBLIC_PATHS.includes(pathname)) {
          router.push("/auth/login")
        } else if (hasSession && (pathname === "/auth/login" || pathname === "/")) {
          // Vault has valid session tokens — redirect to dashboard
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

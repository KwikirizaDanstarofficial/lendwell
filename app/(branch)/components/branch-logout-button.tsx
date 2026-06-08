"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BranchLogoutButton() {
  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined" && "electron" in window) {
        // Electron: clear vault first, then attempt Supabase signOut
        const { electronLogout } = await import("@/lib/electron/login")
        await electronLogout()
      } else {
        await fetch("/api/auth/logout", { method: "POST" })
      }
    } catch {
      // Always redirect to login regardless of errors
    }
    window.location.href = "/auth/login"
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  )
}

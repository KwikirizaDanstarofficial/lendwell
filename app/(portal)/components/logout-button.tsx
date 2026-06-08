"use client"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  async function handleLogout() {
    try {
      if (typeof window !== "undefined" && "electron" in window) {
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
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  )
}

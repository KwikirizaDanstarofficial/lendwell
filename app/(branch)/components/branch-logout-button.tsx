"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BranchLogoutButton() {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/auth/login"
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  )
}

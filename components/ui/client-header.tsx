"use client"

import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  cashier: "Cashier",
  field_agent: "Field Agent",
}

const ROLE_BADGE: Record<string, string> = {
  admin:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  cashier: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  field_agent:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

interface ClientHeaderProps {
  user: { role: string }
}

export function ClientHeader({ user }: ClientHeaderProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1" />
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        suppressHydrationWarning
      >
        {mounted ? (
          <>
            {resolvedTheme === "light" && <Sun className="h-5 w-5" />}
            {resolvedTheme === "dark" && <Moon className="h-5 w-5" />}
            {(!resolvedTheme || resolvedTheme === "system") && (
              <Monitor className="h-5 w-5" />
            )}
          </>
        ) : (
          <Monitor className="h-5 w-5" />
        )}
      </Button>
      <span
        className={[
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          ROLE_BADGE[user.role] ?? ROLE_BADGE.field_agent,
        ].join(" ")}
      >
        {ROLE_LABELS[user.role] ?? user.role}
      </span>
    </header>
  )
}

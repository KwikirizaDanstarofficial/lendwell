"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, Sun, Moon, Monitor, BookOpen, LogOut, Settings, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/providers/theme-provider"
import { useTour } from "@/hooks/use-tour"
import { AppTour } from "@/components/tour/app-tour"

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  cashier: "Cashier",
  branch_admin: "Branch Admin",
  field_agent: "Field Agent",
}

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  cashier: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  branch_admin: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  field_agent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

interface ClientHeaderProps {
  user: { role: string; fullName: string; email: string }
}

export function ClientHeader({ user }: ClientHeaderProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { tourEnabled, shouldAutoStart, startTour, completeTour } = useTour()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && shouldAutoStart) {
      startTour()
    }
  }, [mounted, shouldAutoStart, startTour])

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined" && "electron" in window) {
        const { electronLogout } = await import("@/lib/electron/login")
        await electronLogout()
      } else {
        await fetch("/api/auth/logout", { method: "POST" })
      }
    } catch {}
    router.push("/auth/login")
    router.refresh()
  }

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      {tourEnabled && <AppTour onComplete={completeTour} />}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1" />
        <Button
          id="tour-start-tour"
          variant="ghost"
          size="icon"
          onClick={startTour}
          title="Start guided tour"
        >
          <BookOpen className="h-5 w-5" />
        </Button>
        <Button
          id="tour-header-notifications"
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <Button
          id="tour-header-theme"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          suppressHydrationWarning
        >
          {mounted ? (
            <>
              {resolvedTheme === "light" && <Sun className="h-5 w-5" />}
              {resolvedTheme === "dark" && <Moon className="h-5 w-5" />}
              {!resolvedTheme && (
                <Monitor className="h-5 w-5" />
              )}
            </>
          ) : (
            <Monitor className="h-5 w-5" />
          )}
        </Button>

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            id="tour-user-menu"
            className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar className="h-7 w-7 rounded-full">
              <AvatarFallback className="rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col text-left leading-none sm:flex">
              <span className="max-w-[100px] truncate text-xs font-semibold text-foreground">
                {user.fullName}
              </span>
              <span className="max-w-[100px] truncate text-[10px] text-muted-foreground">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 overflow-hidden rounded-lg p-0" sideOffset={8}>
            {/* Identity block */}
            <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-3.5">
              <Avatar className="h-10 w-10 shrink-0 rounded-full">
                <AvatarFallback className="rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{user.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                <span
                  className={[
                    "mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    ROLE_BADGE[user.role] ?? ROLE_BADGE.field_agent,
                  ].join(" ")}
                >
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </div>
            </div>
            <div className="p-1.5">
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="cursor-pointer rounded-md px-3 py-2 text-sm"
              >
                <Settings className="mr-2.5 h-4 w-4 text-muted-foreground" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5" />
              <DropdownMenuItem
                onClick={handleLogout}
                variant="destructive"
                className="cursor-pointer rounded-md px-3 py-2 text-sm"
              >
                <LogOut className="mr-2.5 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
    </>
  )
}

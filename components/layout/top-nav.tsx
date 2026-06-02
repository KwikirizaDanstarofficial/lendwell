// components/layout/top-nav.tsx
// Top navigation bar for the SACCO dashboard.
// Renders a role-filtered nav menu (desktop dropdowns + mobile sheet),
// theme toggle, notification bell, and user profile dropdown.
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "@/components/providers/theme-provider"
import {
  LayoutDashboard, Users, Banknote, PiggyBank, AlertCircle,
  Settings, FileText, Bell, MessageSquare, UserCog, HelpCircle,
  ChevronDown, Menu, X, Sun, Moon, Monitor, LogOut,
  BookOpen, Activity, Trash2, WifiOff, Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useTour } from "@/hooks/use-tour"
import { useSmsQueue } from "@/hooks/use-sms-queue"
import { AppTour } from "@/components/tour/app-tour"

// ─── Navigation structure ─────────────────────────────────────────────────────

/** All nav groups and their items. Role filtering is applied at render time. */
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ title: "Dashboard",     href: "/dashboard",    icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [
      { title: "Members",            href: "/members",       icon: Users     },
      { title: "Users",              href: "/users",         icon: UserCog   },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Loans",              href: "/loans",         icon: Banknote  },
      { title: "Savings",            href: "/savings",       icon: PiggyBank },
      { title: "Fines",              href: "/fines",         icon: AlertCircle },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Complaints",         href: "/complaints",    icon: MessageSquare },
      { title: "Documents",          href: "/documents",     icon: FileText  },
      { title: "Notifications",      href: "/notifications", icon: Bell      },
      { title: "Support",            href: "/support",       icon: HelpCircle },
    ],
  },
  {
    label: "Reports",
    items: [{ title: "Reports",      href: "/reports",       icon: FileText  }],
  },
  {
    label: "Settings",
    items: [{ title: "Settings",     href: "/settings",      icon: Settings  }],
  },
  {
    label: "System",
    items: [
      { title: "Activity Logs",      href: "/logs",          icon: Activity  },
      { title: "Recycle Bin",        href: "/recycle-bin",   icon: Trash2    },
    ],
  },
] as const

// ─── Role-based access ────────────────────────────────────────────────────────

/** Nav item titles visible to each role. field_agent is the most restricted fallback. */
const ROLE_ALLOWED_ITEMS: Record<string, string[]> = {
  admin: [
    "Dashboard", "Members", "Loans", "Savings", "Fines",
    "Complaints", "Documents", "Notifications", "Reports",
    "Users", "Support", "Settings", "Activity Logs", "Recycle Bin",
  ],
  cashier: [
    "Dashboard", "Members", "Loans", "Savings", "Fines",
    "Complaints", "Documents", "Notifications", "Users", "Support", "Activity Logs",
  ],
  branch_admin: [
    "Dashboard", "Members", "Loans", "Savings", "Fines",
    "Complaints", "Notifications", "Support", "Activity Logs",
  ],
  field_agent: [
    "Dashboard", "Members", "Loans", "Savings", "Fines",
    "Complaints", "Support",
  ],
}

// ─── Role display labels and badge colours ────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin:        "Administrator",
  cashier:      "Cashier",
  branch_admin: "Branch Admin",
  field_agent:  "Field Agent",
}

const ROLE_BADGE_CLASS: Record<string, string> = {
  admin:        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  cashier:      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  branch_admin: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  field_agent:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

// ─── Logo paths ───────────────────────────────────────────────────────────────

const LOGO_DARK_MODE  = "/lendwell-logo-primary.svg"
const LOGO_LIGHT_MODE = "/lendwell-logo-dark.svg"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopNavProps {
  user: { fullName: string; email: string; role: string }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted,    setMounted]    = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isOnline,   setIsOnline]   = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const up   = () => setIsOnline(true)
    const down = () => setIsOnline(false)
    window.addEventListener("online",  up)
    window.addEventListener("offline", down)
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down) }
  }, [])
  const { tourEnabled, shouldAutoStart, startTour, completeTour } = useTour()
  useSmsQueue()

  // Prevent hydration mismatch for theme-dependent logo
  useEffect(() => { setMounted(true) }, [])

  // Auto-start the guided tour for first-time users
  useEffect(() => {
    if (mounted && shouldAutoStart) startTour()
  }, [mounted, shouldAutoStart, startTour])

  // Close mobile menu whenever the route changes
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Filter nav groups to only show items allowed for this role
  const allowedTitles  = ROLE_ALLOWED_ITEMS[user.role] ?? ROLE_ALLOWED_ITEMS.field_agent
  const filteredGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowedTitles.includes(item.title)),
    }))
    .filter((group) => group.items.length > 0)

  /** Cycle through light → dark → system themes. */
  const handleToggleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/auth/login")
    router.refresh()
  }

  // Two-letter avatar initials from the user's display name
  const initials = user.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      {tourEnabled && <AppTour onComplete={completeTour} />}

      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-3 px-4">

          {/* Logo — swapped based on resolved theme */}
          <Link href="/dashboard" className="mr-2 shrink-0">
            {mounted ? (
              <img
                src={resolvedTheme === "dark" ? LOGO_DARK_MODE : LOGO_LIGHT_MODE}
                alt="Lendwell"
                className="h-8 object-contain"
              />
            ) : (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            )}
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden flex-1 items-center gap-0.5 md:flex">
            {filteredGroups.map((group) => {
              const tourId = `tour-nav-${group.label.toLowerCase()}`

              if (group.items.length === 1) {
                const item     = group.items[0]
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    id={tourId}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-4 py-2.5 text-[15px] font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.title}
                  </Link>
                )
              }

              const isGroupActive = group.items.some(
                (item) => pathname === item.href || pathname.startsWith(item.href + "/")
              )

              return (
                <DropdownMenu key={group.label}>
                  <DropdownMenuTrigger
                    id={tourId}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-4 py-2.5 text-[15px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isGroupActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {group.label}
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[190px]">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href || pathname.startsWith(item.href + "/")
                      return (
                        <DropdownMenuItem
                          key={item.href}
                          onClick={() => router.push(item.href)}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 px-4 py-3 text-[15px] text-foreground hover:text-foreground focus:text-foreground",
                            isActive && "font-semibold"
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0 text-foreground" />
                          {item.title}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            })}
          </nav>

          {/* Right-side action buttons */}
          <div className="ml-auto flex items-center gap-1">
            {/* Offline / online indicator */}
            {mounted && (
              <div
                className={cn(
                  "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:flex",
                  isOnline
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {isOnline ? (
                  <><Wifi className="h-3.5 w-3.5" /> Online</>
                ) : (
                  <><WifiOff className="h-3.5 w-3.5" /> Offline</>
                )}
              </div>
            )}

            <Button
              id="tour-start-tour"
              variant="ghost" size="icon"
              onClick={startTour}
              title="Start guided tour"
              className="hidden sm:inline-flex"
            >
              <BookOpen className="h-5 w-5" />
            </Button>

            <Button
              id="tour-header-notifications"
              variant="ghost" size="icon"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </Button>

            <Button
              id="tour-header-theme"
              variant="ghost" size="icon"
              onClick={handleToggleTheme}
              suppressHydrationWarning
            >
              {mounted ? (
                <>
                  {resolvedTheme === "light"  && <Sun   className="h-5 w-5" />}
                  {resolvedTheme === "dark"   && <Moon  className="h-5 w-5" />}
                  {!resolvedTheme             && <Monitor className="h-5 w-5" />}
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
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    <span
                      className={cn(
                        "mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        ROLE_BADGE_CLASS[user.role] ?? ROLE_BADGE_CLASS.field_agent
                      )}
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

            {/* Mobile hamburger */}
            <Button
              variant="ghost" size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile navigation drawer */}
        {mobileOpen && (
          <div className="border-t bg-background md:hidden">
            <nav className="flex flex-col gap-0.5 p-2">
              {filteredGroups.flatMap((group) => group.items).map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </header>
    </>
  )
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED COMPONENTS:
//   TopNav({ user })
//     – sticky top navigation bar
//     – desktop: grouped dropdowns; mobile: full-height sheet
//     – filters nav items per role via ROLE_ALLOWED_ITEMS
//
// KEY CONSTANTS:
//   NAV_GROUPS           – all navigation groups and their items
//   ROLE_ALLOWED_ITEMS   – which nav items each role can see
//   ROLE_LABELS          – human-readable role display names
//   ROLE_BADGE_CLASS     – Tailwind classes for the role badge by role
//   LOGO_DARK_MODE       – SVG path used when theme is dark
//   LOGO_LIGHT_MODE      – SVG path used when theme is light
//
// RELATED FILES:
//   components/providers/theme-provider.tsx – useTheme hook
//   components/tour/app-tour.tsx            – guided tour overlay
//   hooks/use-tour.ts                       – tour state hook
//   lib/utils.ts                            – cn() class merger

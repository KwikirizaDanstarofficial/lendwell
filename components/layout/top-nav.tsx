"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "@/components/providers/theme-provider"
import {
  LayoutDashboard,
  Users,
  Banknote,
  PiggyBank,
  AlertCircle,
  Settings,
  FileText,
  Bell,
  MessageSquare,
  UserCog,
  HelpCircle,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  LogOut,
  BookOpen,
  Activity,
  Trash2,
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
import { AppTour } from "@/components/tour/app-tour"

const navGroups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [
      { title: "Members", href: "/members", icon: Users },
      { title: "Users", href: "/users", icon: UserCog },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Loans", href: "/loans", icon: Banknote },
      { title: "Savings", href: "/savings", icon: PiggyBank },
      { title: "Fines", href: "/fines", icon: AlertCircle },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Complaints", href: "/complaints", icon: MessageSquare },
      { title: "Documents", href: "/documents", icon: FileText },
      { title: "Notifications", href: "/notifications", icon: Bell },
      { title: "Support", href: "/support", icon: HelpCircle },
    ],
  },
  {
    label: "Reports",
    items: [{ title: "Reports", href: "/reports", icon: FileText }],
  },
  {
    label: "Settings",
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
  {
    label: "System",
    items: [
      { title: "Activity Logs", href: "/logs", icon: Activity },
      { title: "Recycle Bin", href: "/recycle-bin", icon: Trash2 },
    ],
  },
]

const ROLE_NAV: Record<string, string[]> = {
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

interface TopNavProps {
  user: { fullName: string; email: string; role: string }
}

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { tourEnabled, shouldAutoStart, startTour, completeTour } = useTour()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && shouldAutoStart) startTour()
  }, [mounted, shouldAutoStart, startTour])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const allowed = ROLE_NAV[user.role] ?? ROLE_NAV.field_agent
  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed.includes(item.title)),
    }))
    .filter((group) => group.items.length > 0)

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-3 px-4">
          {/* Logo */}
          <Link href="/dashboard" className="shrink-0 mr-2">
            {mounted ? (
              <img
                src={
                  resolvedTheme === "dark"
                    ? "/lendwell-logo-primary.svg"
                    : "/lendwell-logo-dark.svg"
                }
                alt="SaccoOS"
                className="h-8 object-contain"
              />
            ) : (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {filteredGroups.map((group) => {
              const tourId = `tour-nav-${group.label.toLowerCase()}`
              if (group.items.length === 1) {
                const item = group.items[0]
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/")
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
                (item) =>
                  pathname === item.href || pathname.startsWith(item.href + "/")
              )

              return (
                <DropdownMenu key={group.label}>
                  <DropdownMenuTrigger asChild>
                    <button
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
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[190px]">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/")
                      return (
                        <DropdownMenuItem
                          key={item.href}
                          onClick={() => router.push(item.href)}
                          className={cn(
                            "flex items-center gap-3 cursor-pointer px-4 py-3 text-[15px] text-foreground hover:text-foreground focus:text-foreground",
                            isActive && "font-semibold"
                          )}
                        >
                          <item.icon className="h-5 w-5 text-foreground shrink-0" />
                          {item.title}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-1">
            <Button
              id="tour-start-tour"
              variant="ghost"
              size="icon"
              onClick={startTour}
              title="Start guided tour"
              className="hidden sm:inline-flex"
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

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  id="tour-user-menu"
                  className="flex items-center gap-2 rounded-full border border-border bg-card pl-1 pr-2.5 py-1 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="h-7 w-7 rounded-full">
                    <AvatarFallback className="rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col text-left leading-none">
                    <span className="truncate text-xs font-semibold max-w-[100px] text-foreground">
                      {user.fullName}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground max-w-[100px]">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60" sideOffset={8}>
                <div className="flex items-center gap-3 px-3 py-3">
                  <Avatar className="h-10 w-10 shrink-0 rounded-full">
                    <AvatarFallback className="rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{user.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    <span
                      className={cn(
                        "mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        ROLE_BADGE[user.role] ?? ROLE_BADGE.field_agent
                      )}
                    >
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/settings")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t bg-background md:hidden">
            <nav className="flex flex-col p-2 gap-0.5">
              {filteredGroups.flatMap((group) => group.items).map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/")
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

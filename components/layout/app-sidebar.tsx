"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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
  LogOut,
  ChevronUp,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from "@/components/ui/sidebar"
import { useTheme } from "next-themes"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { fullName: string; email: string; role: string }
}

type NavItem = { title: string; href: string; icon: React.ElementType }

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
      {
        title: "Complaints",
        href: "/complaints",
        icon: MessageSquare,
      },
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
]

// Which nav items each role can see
const ROLE_NAV: Record<string, string[]> = {
  admin: [
    "Dashboard",
    "Members",
    "Loans",
    "Savings",
    "Fines",
    "Complaints",
    "Documents",
    "Notifications",
    "Reports",
    "Users",
    "Support",
    "Settings",
  ],
  cashier: [
    "Dashboard",
    "Members",
    "Loans",
    "Savings",
    "Fines",
    "Complaints",
    "Documents",
    "Notifications",
    "Users",
    "Support",
  ],
  field_agent: [
    "Dashboard",
    "Members",
    "Loans",
    "Savings",
    "Fines",
    "Complaints",
    "Support",
  ],
}

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

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { state, isMobile } = useSidebar()
  const { theme } = useTheme()
  const [logoSrc, setLogoSrc] = useState("/lendwell-logo-dark.svg")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setLogoSrc(
      theme === "dark" ? "/lendwell-logo-primary.svg" : "/lendwell-logo-dark.svg"
    )
  }, [theme])

  const allowed = ROLE_NAV[user.role] ?? ROLE_NAV.field_agent
  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed.includes(item.title)),
    }))
    .filter((group) => group.items.length > 0)
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <Sidebar collapsible="icon" {...props} suppressHydrationWarning>
      {/* Logo */}
      <SidebarHeader className="py-2">
        <Link href="/dashboard" className="flex w-full items-center px-3">
          {mounted ? (
            <img
              src={
                theme === "dark"
                  ? "/lendwell-logo-primary.svg"
                  : "/lendwell-logo-dark.svg"
              }
              alt="Lendwell"
              className="h-[77px] w-full object-contain"
            />
          ) : (
            <div className="h-[77px] w-full animate-pulse rounded bg-muted" />
          )}
        </Link>
      </SidebarHeader>

      {/* Nav items */}
      <SidebarContent suppressHydrationWarning>
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label} suppressHydrationWarning>
            <SidebarGroupLabel suppressHydrationWarning>
              {mounted ? (
                group.label
              ) : (
                <div className="h-4 animate-pulse rounded bg-muted" />
              )}
            </SidebarGroupLabel>
            <SidebarMenu suppressHydrationWarning>
              {mounted
                ? group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/")
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => router.push(item.href)}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })
                : Array.from({ length: group.items.length }).map((_, i) => (
                    <SidebarMenuItem key={i}>
                      <SidebarMenuButton>
                        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                        <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* User footer with logout */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Account"
                  className="cursor-pointer"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.fullName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56" align="end">
                <div className="px-3 py-2">
                  <p className="text-xs font-medium">{user.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                  <span
                    className={[
                      "mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      ROLE_BADGE[user.role] ?? "",
                    ].join(" ")}
                  >
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

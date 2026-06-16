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
  Layers,
  Receipt,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "@/components/providers/theme-provider"

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
      {       title: "Loans", href: "/loans", icon: Banknote },
      { title: "Savings", href: "/savings", icon: PiggyBank },
      { title: "Transactions", href: "/transactions", icon: Receipt },
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
    label: "Configuration",
    items: [
      { title: "Products", href: "/products", icon: Layers },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

// Which nav items each role can see
const ROLE_NAV: Record<string, string[]> = {
  admin: [
    "Dashboard",
    "Members",
    "Loans",
    "Savings",
    "Transactions",
    "Fines",
    "Complaints",
    "Documents",
    "Notifications",
    "Reports",
    "Users",
    "Support",
    "Products",
    "Settings",
  ],
  cashier: [
    "Dashboard",
    "Members",
    "Loans",
    "Savings",
    "Transactions",
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
    "Transactions",
    "Fines",
    "Complaints",
    "Support",
  ],
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { state, isMobile } = useSidebar()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [theme])

  const allowed = ROLE_NAV[user.role] ?? ROLE_NAV.field_agent
  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed.includes(item.title)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <Sidebar collapsible="icon" {...props} suppressHydrationWarning id="tour-sidebar">
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
          <SidebarGroup
            key={group.label}
            suppressHydrationWarning
            id={`tour-nav-${group.label.toLowerCase()}`}
          >
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

      <SidebarRail />
    </Sidebar>
  )
}

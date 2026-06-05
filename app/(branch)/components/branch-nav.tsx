"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function BranchNav({ code }: { code: string }) {
  const pathname = usePathname()

  const navItems = [
    { title: "Dashboard", href: `/branch/${code}/dashboard`, icon: LayoutDashboard },
    { title: "Members",   href: `/branch/${code}/members`,   icon: Users },
    { title: "Settings",  href: `/branch/${code}/settings`,  icon: Settings },
  ]

  return (
    <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
      {navItems.map(({ title, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {title}
          </Link>
        )
      })}
    </nav>
  )
}

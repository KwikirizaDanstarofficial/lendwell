"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  LayoutDashboard,
  Users,
  Banknote,
  PiggyBank,
  AlertCircle,
  Settings,
  FileText,
  Bell,
  MessageSquare,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

const pages = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Members", href: "/members", icon: Users },
  { title: "Loans", href: "/loans", icon: Banknote },
  { title: "Savings", href: "/savings", icon: PiggyBank },
  { title: "Fines", href: "/fines", icon: AlertCircle },
  { title: "Reports", href: "/reports", icon: FileText },
  { title: "Documents", href: "/documents", icon: FileText },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Complaints", href: "/complaints", icon: MessageSquare },
  { title: "Settings", href: "/settings", icon: Settings },
]

const quickActions = [
  { title: "Add new member", href: "/members", icon: Plus },
  { title: "New loan application", href: "/loans", icon: Plus },
  { title: "Record savings deposit", href: "/savings", icon: Plus },
  { title: "Issue a fine", href: "/fines", icon: Plus },
]

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2 shrink-0" />
        <span className="hidden xl:inline-flex text-muted-foreground font-normal text-sm">
          Search...
        </span>
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Pages">
            {pages.map((page) => (
              <CommandItem
                key={page.href}
                value={page.title}
                onSelect={() => handleSelect(page.href)}
                className="cursor-pointer"
              >
                <page.icon className="mr-2 h-4 w-4" />
                {page.title}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick Actions">
            {quickActions.map((action) => (
              <CommandItem
                key={action.title}
                value={action.title}
                onSelect={() => handleSelect(action.href)}
                className="cursor-pointer"
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
"use client"

import { useEffect, useState } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"

interface NotificationItem {
  id: string
  title: string
  body: string
  channel: string
  status: string
  sent_at: Date | null
  read_at: Date | null
  created_at: Date | null
  member_name: string | null
}

function timeAgo(date: Date | null | undefined): string {
  if (!date) return "—"
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const channelIcons: Record<string, string> = {
  sms: "💬",
  in_app: "🔔",
}

const statusColors: Record<string, string> = {
  sent: "bg-green-500",
  failed: "bg-red-500",
  pending: "bg-yellow-500",
}

export function Notifications() {
  const router = useRouter()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications/latest")
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open])

  const unreadCount = items.filter((n) => !n.read_at).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <span className="relative inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10 cursor-pointer">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <span className="text-xs text-muted-foreground">
            {unreadCount} unread
          </span>
        </div>
        <Separator />

        <div className="divide-y max-h-[380px] overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No notifications yet
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                  !n.read_at ? "bg-muted/20" : ""
                }`}
              >
                {/* Status dot */}
                <div
                  className={`mt-2 h-2 w-2 rounded-full shrink-0 ${
                    !n.read_at
                      ? "bg-primary"
                      : "bg-transparent"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <span className="text-xs shrink-0">
                      {channelIcons[n.channel] ?? "🔔"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {n.body}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(n.sent_at ?? n.created_at)}
                    </span>
                    {n.member_name && (
                      <>
                        <span className="text-muted-foreground/40 text-xs">·</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {n.member_name}
                        </span>
                      </>
                    )}
                    <span
                      className={`ml-auto h-1.5 w-1.5 rounded-full shrink-0 ${
                        statusColors[n.status] ?? "bg-gray-400"
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Separator />
        <div className="p-2 flex gap-2">
          <Button
            variant="ghost"
            className="flex-1 text-xs h-8"
            onClick={() => {
              setOpen(false)
              router.push("/notifications")
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
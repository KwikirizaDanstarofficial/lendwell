"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, History, Bell, CheckCircle, XCircle, Clock } from "lucide-react"
import { SendNotificationForm } from "./send-notification-form"
import { NotificationsHistory } from "./notifications-history"
import { cn } from "@/lib/utils"

interface NotificationsClientProps {
  notifications: any[]
  members: any[]
  saccoName: string
  saccoColor: string
}

const tabs = [
  { id: "send",    label: "Send Notification", icon: Send,    color: "text-blue-500" },
  { id: "history", label: "History",            icon: History, color: "text-purple-500" },
]

export function NotificationsClient({
  notifications,
  members,
  saccoName,
  saccoColor,
}: NotificationsClientProps) {
  const [activeTab, setActiveTab] = useState("send")

  const safeNotifications = notifications ?? []
  const safeMembers = members ?? []

  const sentCount    = safeNotifications.filter((n) => n.status === "sent").length
  const failedCount  = safeNotifications.filter((n) => n.status === "failed").length
  const pendingCount = safeNotifications.filter((n) => n.status === "pending").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Send and manage member notifications</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Sent</CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><p className="text-xl font-bold">{safeNotifications.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs text-muted-foreground">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><p className="text-xl font-bold">{sentCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs text-muted-foreground">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent><p className="text-xl font-bold">{failedCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs text-muted-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><p className="text-xl font-bold">{pendingCount}</p></CardContent>
        </Card>
      </div>

      <div className="space-y-0">
        <div className="border-b">
          <nav className="-mb-px flex gap-0 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon, color }) => {
              const isActive = activeTab === id
              const badgeCount = id === "history" ? safeNotifications.length : 0
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? color : "")} />
                  {label}
                  {badgeCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">{badgeCount}</Badge>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="pt-6">
          {activeTab === "send" && (
            <SendNotificationForm members={safeMembers} />
          )}
          {activeTab === "history" && (
            <NotificationsHistory
              notifications={safeNotifications}
              members={safeMembers}
              saccoName={saccoName}
              saccoColor={saccoColor}
            />
          )}
        </div>
      </div>
    </div>
  )
}

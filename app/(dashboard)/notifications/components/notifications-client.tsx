"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  History,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Megaphone,
  Archive,
} from "lucide-react"
import { SendNotificationForm } from "./send-notification-form"
import { NotificationsHistory } from "./notifications-history"
import { cn } from "@/lib/utils"

interface NotificationsClientProps {
  notifications: any[]
  members: any[]
}

// Tab configuration for vertical sidebar
const notificationTabs = [
  {
    id: "send",
    label: "Send Notification",
    icon: Send,
    color: "text-blue-500",
    description: "Create and send new notifications",
  },
  {
    id: "history",
    label: "History",
    icon: History,
    color: "text-purple-500",
    description: "View all sent notifications",
  },
]

export function NotificationsClient({
  notifications,
  members,
}: NotificationsClientProps) {
  const [activeTab, setActiveTab] = useState("send")

  // Handle null/undefined data
  const safeNotifications = notifications ?? []
  const safeMembers = members ?? []

  const sentCount = safeNotifications.filter((n) => n.status === "sent").length
  const failedCount = safeNotifications.filter(
    (n) => n.status === "failed"
  ).length
  const pendingCount = safeNotifications.filter(
    (n) => n.status === "pending"
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send and manage member notifications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              Total Sent
            </CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{notifications.length}</p>
          </CardContent>
        </Card>
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              Delivered
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{sentCount}</p>
          </CardContent>
        </Card>
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              Failed
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{failedCount}</p>
          </CardContent>
        </Card>
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Layout with Vertical Tabs */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Vertical Tabs Sidebar */}
        <div className="shrink-0 lg:w-64">
          <div className="sticky top-6">
            <div className="rounded-lg border bg-card">
              <div className="border-b p-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold">Notification Center</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Manage all communications
                </p>
              </div>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <nav className="flex flex-col space-y-1 p-2">
                  {notificationTabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    const badgeCount =
                      tab.id === "history" ? notifications.length : 0

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-md px-3 py-3 text-left text-sm font-medium transition-all duration-200",
                          "hover:bg-muted hover:text-foreground",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        <Icon
                          className={cn("mt-0.5 h-5 w-5 shrink-0", tab.color)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{tab.label}</span>
                            {badgeCount > 0 && (
                              <Badge
                                variant="secondary"
                                className="shrink-0 text-xs"
                              >
                                {badgeCount}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {tab.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </nav>
              </ScrollArea>

              {/* Footer note */}
              <div className="border-t bg-muted/30 p-3">
                <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
                  <Archive className="h-3 w-3" />
                  Notifications are saved for 30 days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Send Notification Tab */}
          {activeTab === "send" && (
            <div className="space-y-4">
              <div className="mb-2 flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Send Notification</h2>
                <Badge variant="outline" className="ml-2">
                  Available members: {members.length}
                </Badge>
              </div>
              <SendNotificationForm members={safeMembers} />
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="mb-2 flex items-center gap-2">
                <History className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold">Notification History</h2>
                <div className="ml-2 flex items-center gap-2">
                  <Badge
                    variant="default"
                    className="border-green-200 bg-green-500/10 text-green-600"
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {sentCount} Sent
                  </Badge>
                  <Badge
                    variant="default"
                    className="border-red-200 bg-red-500/10 text-red-600"
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    {failedCount} Failed
                  </Badge>
                  <Badge
                    variant="default"
                    className="border-yellow-200 bg-yellow-500/10 text-yellow-600"
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    {pendingCount} Pending
                  </Badge>
                </div>
              </div>
              <NotificationsHistory notifications={safeNotifications} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

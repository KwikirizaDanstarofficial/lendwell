"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  MoreHorizontal,
  Trash2,
  MessageSquare,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { deleteNotificationAction } from "../actions"
import { toast } from "sonner"

const statusConfig: Record<
  string,
  { icon: any; color: string; label: string }
> = {
  sent: {
    icon: CheckCircle,
    color: "text-green-500",
    label: "Sent",
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    label: "Failed",
  },
  pending: {
    icon: Clock,
    color: "text-yellow-500",
    label: "Pending",
  },
}

export function NotificationsHistory({
  notifications,
}: {
  notifications: any[]
}) {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // Handle null/undefined notifications
  const safeNotifications = notifications ?? []

  const filtered = safeNotifications.filter((n) => {
    return (
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.memberName?.toLowerCase().includes(search.toLowerCase()) ||
      n.body?.toLowerCase().includes(search.toLowerCase())
    )
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="space-y-4">
      <div className="relative w-full">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notifications..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border py-16 text-muted-foreground">
          <Bell className="mb-2 h-10 w-10 opacity-30" />
          <p className="text-lg font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Title</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((n) => {
                const status = statusConfig[n.status] ?? statusConfig.pending
                const StatusIcon = status.icon
                return (
                  <TableRow key={n.id} className="hover:bg-muted/30">
                    <TableCell>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {n.body}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{n.memberName ?? "All Members"}</p>
                      {n.recipientPhone && (
                        <p className="text-xs text-muted-foreground">
                          {n.recipientPhone}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        {n.channel === "sms" ? (
                          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {n.channel === "sms" ? "SMS" : "In-App"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`flex items-center gap-1.5 text-sm ${status.color}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(n.sentAt ?? n.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={async () => {
                              const res = await deleteNotificationAction(n.id)
                              if (res.success) toast.success("Deleted")
                              else toast.error(res.error)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filtered.length)} of{" "}
            {filtered.length} notifications
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8"
                  >
                    {page}
                  </Button>
                )
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

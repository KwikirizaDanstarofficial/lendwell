"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Download,
} from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { deleteNotificationAction } from "../actions"
import { toast } from "sonner"

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  sent: { icon: CheckCircle, color: "text-green-500", label: "Sent" },
  failed: { icon: XCircle, color: "text-red-500", label: "Failed" },
  pending: { icon: Clock, color: "text-yellow-500", label: "Pending" },
}

export function NotificationsHistory({
  notifications,
  members = [],
  saccoName = "SACCO",
  saccoColor = "#16a34a",
}: {
  notifications: any[]
  members?: { id: string; full_name?: string; fullName?: string; member_code?: string; memberCode?: string }[]
  saccoName?: string
  saccoColor?: string
}) {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const safeNotifications = notifications ?? []

  const filtered = useMemo(() => {
    return safeNotifications.filter((n) => {
      const q = search.toLowerCase()
      return (
        !q ||
        n.title?.toLowerCase().includes(q) ||
        n.memberName?.toLowerCase().includes(q) ||
        n.body?.toLowerCase().includes(q)
      )
    })
  }, [safeNotifications, search])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleDownloadPdf = () => {
    const memberLabel = "All Members"

    const escape = (s: string) =>
      (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    const rows = filtered
      .map((n) => {
        const statusLabel = statusConfig[n.status]?.label ?? n.status
        const statusColor =
          n.status === "sent" ? "#16a34a" : n.status === "failed" ? "#dc2626" : "#ca8a04"
        return `
          <tr>
            <td>
              <div style="font-weight:600;font-size:11px">${escape(n.title ?? "—")}</div>
              <div style="color:#555;font-size:10px;margin-top:2px;line-height:1.4">${escape(n.body ?? "")}</div>
            </td>
            <td style="font-size:11px">${escape(n.memberName ?? "All Members")}${n.recipientPhone ? `<br><span style="color:#888;font-size:10px">${escape(n.recipientPhone)}</span>` : ""}</td>
            <td style="font-size:11px">${n.channel === "sms" ? "SMS" : "In-App"}</td>
            <td style="font-size:11px;color:${statusColor};font-weight:600">${statusLabel}</td>
            <td style="font-size:11px;white-space:nowrap">${formatDate(n.sentAt ?? n.createdAt)}</td>
          </tr>`
      })
      .join("")

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Notification History — ${escape(saccoName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 28px; }
    .header { border-bottom: 3px solid ${saccoColor}; padding-bottom: 12px; margin-bottom: 16px; display: flex; align-items: flex-start; justify-content: space-between; }
    .header h1 { font-size: 20px; font-weight: 700; color: ${saccoColor}; }
    .header .sacco { font-size: 11px; color: #555; margin-top: 3px; }
    .meta { font-size: 11px; color: #555; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: ${saccoColor}; color: #fff; text-align: left; padding: 7px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #f9fafb; }
    .footer { margin-top: 20px; font-size: 10px; color: #888; border-top: 1px solid #e5e7eb; padding-top: 8px; display: flex; justify-content: space-between; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Notification History</h1>
      <p class="sacco">${escape(saccoName)}</p>
    </div>
    <div style="text-align:right">
      <p class="meta">Member: <strong>${escape(memberLabel)}</strong></p>
      <p class="meta">Records: <strong>${filtered.length}</strong></p>
      <p class="meta">Generated: ${new Date().toLocaleString()}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="min-width:200px">Title / Message</th>
        <th style="min-width:120px">Member</th>
        <th style="width:70px">Channel</th>
        <th style="width:70px">Status</th>
        <th style="width:100px">Sent At</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>${escape(saccoName)} — Notification History</span>
    <span>Page 1</span>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`

    // Use iframe to avoid popup blocker
    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "none"
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) { document.body.removeChild(iframe); return }
    doc.open()
    doc.write(html)
    doc.close()
    iframe.contentWindow?.focus()
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }, 300)
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="shrink-0 text-sm text-muted-foreground">
          {filtered.length} of {safeNotifications.length} notifications
        </p>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search title, member, message..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="shrink-0">
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border py-16 text-muted-foreground">
          <Bell className="mb-2 h-10 w-10 opacity-30" />
          <p className="text-lg font-medium">No notifications found</p>
        </div>
      ) : (
        <div className="overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[160px] max-w-[280px]">Title</TableHead>
                <TableHead className="min-w-[120px]">Member</TableHead>
                <TableHead className="w-24">Channel</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32">Sent At</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((n) => {
                const status = statusConfig[n.status] ?? statusConfig.pending
                const StatusIcon = status.icon
                return (
                  <TableRow key={n.id} className="hover:bg-muted/30">
                    <TableCell className="max-w-[280px]">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <p className="line-clamp-1 truncate text-xs text-muted-foreground">
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
                      <div className={`flex items-center gap-1.5 text-sm ${status.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(n.sentAt ?? n.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                          <MoreHorizontal className="h-4 w-4" />
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
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8"
              >
                {page}
              </Button>
            ))}
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

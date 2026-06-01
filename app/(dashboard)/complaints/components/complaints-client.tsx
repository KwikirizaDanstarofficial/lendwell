"use client"

import { useState, useMemo, useEffect } from "react"
import { useQuery } from "@powersync/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  SlidersHorizontal,
  Inbox,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react"
import { AddComplaintDialog } from "./add-complaint-dialog"
import { ComplaintCard } from "./complaint-card"
import { type Complaint } from "./complaints-table"

type MemberSelect = {
  id: string
  full_name: string
  member_code: string
  phone: string | null
}

interface ComplaintsClientProps {
  saccoId: string
}

export const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  resolved:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

export const categoryLabels: Record<string, string> = {
  general: "General",
  loan: "Loan",
  savings: "Savings",
  service: "Service",
  technical: "Technical",
  other: "Other",
}

export const categoryColors: Record<string, string> = {
  general: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
  loan: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  savings:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  service:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  technical: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  other: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
}

export function ComplaintsClient({ saccoId }: ComplaintsClientProps) {
  const { data: complaintRows = [] } = useQuery(
    `SELECT c.id, c.sacco_id, c.member_id, c.complaint_ref, c.subject, c.body,
             c.category, c.priority, c.status, c.assigned_to, c.resolution_notes,
             c.resolved_at, c.notes, c.created_at, c.updated_at,
             m.full_name AS member_name, m.member_code, m.phone AS member_phone
      FROM complaints c
      LEFT JOIN members m ON m.id = c.member_id
      WHERE c.sacco_id = ?
      ORDER BY c.created_at DESC`,
    [saccoId]
  )
  const { data: memberRows = [] } = useQuery(
    "SELECT id, full_name, member_code, phone FROM members WHERE sacco_id = ? ORDER BY full_name ASC",
    [saccoId]
  )
  const complaints = useMemo(() => (complaintRows as any[]).map((r) => ({
    id: r.id, sacco_id: r.sacco_id, member_id: r.member_id,
    complaint_ref: r.complaint_ref, complaintRef: r.complaint_ref,
    subject: r.subject, body: r.body, category: r.category,
    priority: r.priority, status: r.status, assigned_to: r.assigned_to,
    resolution_notes: r.resolution_notes, notes: r.notes,
    resolved_at: r.resolved_at ? new Date(r.resolved_at) : null,
    created_at: r.created_at, updated_at: r.updated_at,
    member_name: r.member_name ?? "", memberName: r.member_name ?? "",
    member_code: r.member_code ?? "", memberCode: r.member_code ?? "",
    member_phone: r.member_phone ?? null,
    saccoId: r.sacco_id, memberId: r.member_id, assignedTo: r.assigned_to ?? null,
    resolutionNotes: r.resolution_notes ?? null, createdAt: r.created_at ? new Date(r.created_at) : null,
    updatedAt: r.updated_at ? new Date(r.updated_at) : null, resolvedAt: r.resolved_at ? new Date(r.resolved_at) : null,
    resolvedBy: r.resolved_by ?? null, satisfactionRating: r.satisfaction_rating ?? null,
    feedback: r.feedback ?? null, memberPhone: r.member_phone ?? null,
  })), [complaintRows])
  const members: MemberSelect[] = useMemo(() => (memberRows as any[]).map((r) => ({
    id: r.id, full_name: r.full_name, member_code: r.member_code, phone: r.phone ?? null,
  })), [memberRows])
  const stats = useMemo(() => ({
    total: complaints.length,
    open: complaints.filter((c) => c.status === "open").length,
    inProgress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  }), [complaints])
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>("all")
  const [priorityFilter, setPriorityFilter] = useState<string | null>("all")
  const [categoryFilter, setCategoryFilter] = useState<string | null>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchSearch =
        c.subject?.toLowerCase().includes(search.toLowerCase()) ||
        c.memberName?.toLowerCase().includes(search.toLowerCase()) ||
        c.complaintRef?.toLowerCase().includes(search.toLowerCase()) ||
        c.body?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || c.status === statusFilter
      const matchPriority =
        priorityFilter === "all" || c.priority === priorityFilter
      const matchCategory =
        categoryFilter === "all" || c.category === categoryFilter
      return matchSearch && matchStatus && matchPriority && matchCategory
    })
  }, [complaints, search, statusFilter, priorityFilter, categoryFilter])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, priorityFilter, categoryFilter])

  const kpiCards = [
    {
      label: "Total",
      value: stats.total,
      icon: MessageSquare,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-l-blue-500",
      filter: "all",
    },
    {
      label: "Open",
      value: stats.open,
      icon: Inbox,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-l-yellow-500",
      filter: "open",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-l-blue-500",
      filter: "in_progress",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-l-green-500",
      filter: "resolved",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Complaints & Issues
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and resolve member complaints
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Complaint
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`group relative cursor-pointer overflow-hidden rounded border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md ${statusFilter === card.filter ? "ring-2 ring-primary" : ""}`}
            onClick={() =>
              setStatusFilter(
                statusFilter === card.filter ? "all" : card.filter
              )
            }
          >
            {/* Left accent bar */}

            {/* Subtle tinted background on hover */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: `radial-gradient(ellipse at top left, ${card.color.replace("text-", "").replace("-500", "") === "blue" ? "#3b82f6" : card.color.replace("text-", "").replace("-500", "") === "yellow" ? "#eab308" : card.color.replace("text-", "").replace("-500", "") === "green" ? "#10b981" : "#6b7280"}08, transparent 70%)`,
              }}
            />

            <div className="relative px-5 pt-4 pb-4">
              {/* Top row: title + icon */}
              <div className="mb-3 flex items-start justify-between">
                <p className="text-xs leading-none font-semibold tracking-widest text-muted-foreground uppercase">
                  {card.label}
                </p>
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: `${card.color.replace("text-", "").replace("-500", "") === "blue" ? "#3b82f6" : card.color.replace("text-", "").replace("-500", "") === "yellow" ? "#eab308" : card.color.replace("text-", "").replace("-500", "") === "green" ? "#10b981" : "#6b7280"}18`,
                  }}
                >
                  <card.icon
                    className="h-4 w-4"
                    style={{
                      color:
                        card.color.replace("text-", "").replace("-500", "") ===
                        "blue"
                          ? "#3b82f6"
                          : card.color
                                .replace("text-", "")
                                .replace("-500", "") === "yellow"
                            ? "#eab308"
                            : card.color
                                  .replace("text-", "")
                                  .replace("-500", "") === "green"
                              ? "#10b981"
                              : "#6b7280",
                    }}
                  />
                </div>
              </div>

              {/* Value */}
              <p className="mb-3 text-[1.6rem] leading-none font-bold tracking-tight text-foreground tabular-nums">
                {card.value}
              </p>
            </div>

            {/* Bottom accent line */}
            <div
              className="absolute right-3 bottom-0 left-3 h-px opacity-20"
              style={{
                background: `linear-gradient(to right, transparent, ${card.color.replace("text-", "").replace("-500", "") === "blue" ? "#3b82f6" : card.color.replace("text-", "").replace("-500", "") === "yellow" ? "#eab308" : card.color.replace("text-", "").replace("-500", "") === "green" ? "#10b981" : "#6b7280"}, transparent)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative w-full">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search complaints, members, refs..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="loan">Loan</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {paginated.length} of {filtered.length} complaints
      </p>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-muted-foreground">
          <MessageSquare className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">No complaints found</p>
          <p className="mt-1 text-sm">
            {search || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "No complaints have been submitted yet"}
          </p>
          {!search && statusFilter === "all" && (
            <Button className="mt-4" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Complaint
            </Button>
          )}
        </div>
      )}

      {/* Complaints Grid */}
      {paginated.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {paginated.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing <strong>{(page - 1) * pageSize + 1}</strong> -{" "}
            <strong>{Math.min(page * pageSize, filtered.length)}</strong> of{" "}
            <strong>{filtered.length}</strong> results
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddComplaintDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        members={members}
      />
    </div>
  )
}

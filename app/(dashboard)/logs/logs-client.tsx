"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Activity } from "lucide-react"
import type { ActivityLog } from "@/db/queries/activity-logs"

const ACTION_COLORS: Record<string, string> = {
  create:           "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  update:           "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delete:           "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  restore:          "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  approve:          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  decline:          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  disburse:         "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  repay:            "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  top_up:           "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  deposit:          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  withdraw:         "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  pay_fine:         "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  waive_fine:       "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
  add_guarantor:    "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  remove_guarantor: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  send_sms:         "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
}

const ROLE_COLORS: Record<string, string> = {
  admin:       "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  cashier:     "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  field_agent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-UG", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function cap(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function LogsClient({ logs }: { logs: ActivityLog[] }) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return logs
    return logs.filter((l) =>
      l.actorName?.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entity.toLowerCase().includes(q) ||
      l.entityRef?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q)
    )
  }, [logs, search])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {logs.length} total events — who did what and when
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search actor, action, entity…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-muted-foreground">
          <Activity className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">No activity logs found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">When</th>
                  <th className="px-4 py-3 text-left font-medium">Actor</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">Entity</th>
                  <th className="px-4 py-3 text-left font-medium">Ref</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((log) => (
                  <tr key={log.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{log.actorName ?? "System"}</span>
                        {log.actorRole && (
                          <span className={`inline-flex w-fit items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[log.actorRole] ?? ""}`}>
                            {cap(log.actorRole)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                        {cap(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {log.entity}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {log.entityRef ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {log.description ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

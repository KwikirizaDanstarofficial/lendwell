"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, RotateCcw, Loader2, Users, Banknote, AlertCircle } from "lucide-react"
import { restoreRecordAction, permanentDeleteAction } from "./actions"
import { cn } from "@/lib/utils"

type Table = "members" | "loans" | "fines"

interface RecycledItem {
  id: string
  ref: string
  name: string
  sub: string
  deletedAt: string
  table: Table
}

interface RecycleBinClientProps {
  isAdmin: boolean
  members: RecycledItem[]
  loans: RecycledItem[]
  fines: RecycledItem[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-UG", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const TABLE_ICON: Record<Table, React.ElementType> = {
  members: Users,
  loans: Banknote,
  fines: AlertCircle,
}

const tabs = [
  { id: "members", label: "Members", icon: Users,        count: (items: RecycleBinClientProps) => items.members.length },
  { id: "loans",   label: "Loans",   icon: Banknote,     count: (items: RecycleBinClientProps) => items.loans.length },
  { id: "fines",   label: "Fines",   icon: AlertCircle,  count: (items: RecycleBinClientProps) => items.fines.length },
]

export function RecycleBinClient({ isAdmin, members, loans, fines }: RecycleBinClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"members" | "loans" | "fines">("members")
  const [loading, setLoading] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<RecycledItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RecycledItem | null>(null)

  const handleRestore = async () => {
    if (!restoreTarget) return
    setLoading(true)
    const res = await restoreRecordAction(restoreTarget.table, restoreTarget.id, restoreTarget.ref)
    setLoading(false)
    setRestoreTarget(null)
    if (res.success) { toast.success("Restored successfully"); router.refresh() }
    else toast.error(res.error)
  }

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return
    setLoading(true)
    const res = await permanentDeleteAction(deleteTarget.table, deleteTarget.id, deleteTarget.ref)
    setLoading(false)
    setDeleteTarget(null)
    if (res.success) { toast.success("Permanently deleted"); router.refresh() }
    else toast.error(res.error)
  }

  const ItemList = ({ items }: { items: RecycledItem[] }) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border py-16 text-muted-foreground">
          <Trash2 className="mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm font-medium">Nothing here</p>
        </div>
      )
    }
    return (
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = TABLE_ICON[item.table]
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{item.ref}</p>
                  {item.sub && <p className="text-xs text-muted-foreground">{item.sub}</p>}
                  <p className="text-xs text-destructive/70 mt-0.5">Deleted {formatDate(item.deletedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRestoreTarget(item)}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Restore
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete Forever
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const total = members.length + loans.length + fines.length

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recycle Bin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} deleted {total === 1 ? "record" : "records"} — restore or permanently delete
          </p>
          {!isAdmin && (
            <p className="mt-1 text-xs text-muted-foreground italic">
              Permanent deletion is restricted to admins.
            </p>
          )}
        </div>

        <div className="space-y-0">
          <div className="border-b">
            <nav className="-mb-px flex gap-0 overflow-x-auto">
              {tabs.map(({ id, label, icon: Icon, count }) => {
                const isActive = activeTab === id
                const n = count({ isAdmin, members, loans, fines })
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as typeof activeTab)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    {n > 0 && (
                      <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs">{n}</span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
          <div className="pt-4">
            {activeTab === "members" && <ItemList items={members} />}
            {activeTab === "loans"   && <ItemList items={loans} />}
            {activeTab === "fines"   && <ItemList items={fines} />}
          </div>
        </div>
      </div>

      {/* Restore dialog */}
      <AlertDialog open={!!restoreTarget} onOpenChange={(o) => { if (!o) setRestoreTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore {restoreTarget?.ref}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore <strong>{restoreTarget?.name}</strong> and make it active again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Restoring…</> : "Yes, Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete {deleteTarget?.ref}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will <strong>permanently delete</strong> <strong>{deleteTarget?.name}</strong> and all related data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : "Yes, Delete Forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

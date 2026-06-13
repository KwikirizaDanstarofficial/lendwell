"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePowerSync } from "@powersync/react"
import { toast } from "sonner"
import { offlineAddGuarantor, offlineRemoveGuarantor, offlineUpdateGuarantorStatus } from "@/lib/powersync/offline-mutations"
import { isOffline } from "@/lib/utils/is-offline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Shield, Plus, Trash2, Loader2, Search, CheckCircle, XCircle, Clock } from "lucide-react"
import { addGuarantorAction, removeGuarantorAction, updateGuarantorStatusAction } from "./guarantor-actions"

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:  <Clock className="h-3.5 w-3.5" />,
  accepted: <CheckCircle className="h-3.5 w-3.5" />,
  declined: <XCircle className="h-3.5 w-3.5" />,
}

interface Guarantor {
  id: string
  member_id: string
  status: string
  notes: string | null
  created_at: string
  members: {
    id: string
    full_name: string
    member_code: string
    phone: string | null
    photo_url: string | null
  } | null
}

interface MemberOption {
  id: string
  full_name: string
  member_code: string
  phone: string | null
}

interface GuarantorsSectionProps {
  loanId: string
  loanRef: string
  saccoId: string
  guarantors: Guarantor[]
  members: MemberOption[]
  borrowerMemberId: string
}

export function GuarantorsSection({
  loanId, loanRef, saccoId, guarantors, members, borrowerMemberId,
}: GuarantorsSectionProps) {
  const db = usePowerSync()
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Guarantor | null>(null)
  const [search, setSearch] = useState("")
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const guarantorMemberIds = new Set(guarantors.map((g) => g.member_id))

  const availableMembers = members.filter(
    (m) => m.id !== borrowerMemberId && !guarantorMemberIds.has(m.id)
  )

  const filteredMembers = availableMembers.filter(
    (m) =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.member_code.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async () => {
    if (!selectedMemberId) { toast.error("Select a member"); return }
    setLoading(true)
    if (isOffline()) {
      try {
        await offlineAddGuarantor(db, saccoId, loanId, selectedMemberId, notes || undefined)
        toast.success("Guarantor added offline — will sync")
        setShowAdd(false)
        setSelectedMemberId("")
        setNotes("")
        setSearch("")
        router.refresh()
      } catch { toast.error("Failed to add guarantor offline") }
      setLoading(false)
      return
    }
    const res = await addGuarantorAction(loanId, selectedMemberId, loanRef, notes || undefined)
    setLoading(false)
    if (res.success) {
      toast.success("Guarantor added")
      setShowAdd(false)
      setSelectedMemberId("")
      setNotes("")
      setSearch("")
      router.refresh()
    } else if (res.offline) {
      try {
        await offlineAddGuarantor(db, saccoId, loanId, selectedMemberId, notes || undefined)
        toast.success("Guarantor added offline — will sync")
        setShowAdd(false)
        setSelectedMemberId("")
        setNotes("")
        setSearch("")
        router.refresh()
      } catch { toast.error(res.error || "Failed to add guarantor offline") }
    } else {
      toast.error(res.error)
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    setLoading(true)
    if (isOffline()) {
      try {
        await offlineRemoveGuarantor(db, removeTarget.id)
        toast.success("Guarantor removed offline — will sync")
        setRemoveTarget(null)
        router.refresh()
      } catch { toast.error("Failed to remove guarantor offline") }
      setLoading(false)
      return
    }
    const res = await removeGuarantorAction(removeTarget.id, loanId, loanRef)
    setLoading(false)
    setRemoveTarget(null)
    if (res.success) { toast.success("Guarantor removed"); router.refresh() }
    else if (res.offline) {
      try {
        await offlineRemoveGuarantor(db, removeTarget.id)
        toast.success("Guarantor removed offline — will sync")
        router.refresh()
      } catch { toast.error(res.error || "Failed to remove guarantor offline") }
    } else toast.error(res.error)
  }

  const handleStatusChange = async (g: Guarantor, status: "pending" | "accepted" | "declined") => {
    if (isOffline()) {
      try {
        await offlineUpdateGuarantorStatus(db, g.id, status)
        toast.success("Status updated offline — will sync")
        router.refresh()
      } catch { toast.error("Failed to update status offline") }
      return
    }
    const res = await updateGuarantorStatusAction(g.id, loanId, loanRef, status)
    if (res.success) { toast.success("Status updated"); router.refresh() }
    else if (res.offline) {
      try {
        await offlineUpdateGuarantorStatus(db, g.id, status)
        toast.success("Status updated offline — will sync")
        router.refresh()
      } catch { toast.error(res.error || "Failed to update status offline") }
    } else toast.error(res.error)
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="text-sm font-semibold tracking-widest text-foreground uppercase">
              Guarantors ({guarantors.length})
            </h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Guarantor
          </Button>
        </div>

        {/* List */}
        {guarantors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No guarantors added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {guarantors.map((g) => {
              const m = g.members
              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={m?.photo_url ?? ""} />
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {(m?.full_name ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{m?.full_name ?? "Unknown"}</p>
                      <p className="font-mono text-xs text-muted-foreground">{m?.member_code}</p>
                      {m?.phone && <p className="text-xs text-muted-foreground">{m.phone}</p>}
                      {g.notes && <p className="mt-0.5 text-xs italic text-muted-foreground">{g.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={g.status}
                      onValueChange={(v) => handleStatusChange(g, v as any)}
                    >
                      <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[g.status] ?? ""}`}>
                      {STATUS_ICON[g.status]}
                      {g.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setRemoveTarget(g)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Guarantor</DialogTitle>
            <DialogDescription>Select a member to guarantee loan {loanRef}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search member name or code…"
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedMemberId("") }}
              />
            </div>
            <div className="max-h-52 overflow-y-auto space-y-1 rounded-lg border p-1">
              {filteredMembers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No available members</p>
              ) : (
                filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${selectedMemberId === m.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                    onClick={() => setSelectedMemberId(m.id)}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                        {m.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{m.full_name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{m.member_code} {m.phone && `· ${m.phone}`}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <Input
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleAdd} disabled={loading || !selectedMemberId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Guarantor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirm */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => { if (!o) setRemoveTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Guarantor?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {removeTarget?.members?.full_name} as a guarantor for loan {loanRef}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Removing…</> : "Yes, Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

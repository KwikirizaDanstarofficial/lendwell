"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UserCheck, Plus, Pencil, Trash2, Star, Loader2, Phone, Mail, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  addNextOfKinAction,
  updateNextOfKinAction,
  removeNextOfKinAction,
} from "../next-of-kin-actions"
import type { NextOfKin } from "@/db/queries/next-of-kin"

interface NextOfKinSectionProps {
  memberId: string
  memberCode: string
  nextOfKin: NextOfKin[]
}

const RELATIONSHIPS = [
  "Spouse", "Parent", "Child", "Sibling", "Cousin",
  "Friend", "Guardian", "Colleague", "Other",
]

type FormState = {
  fullName: string
  relationship: string
  phone: string
  email: string
  address: string
  isPrimary: boolean
}

const emptyForm = (): FormState => ({
  fullName: "", relationship: "", phone: "", email: "", address: "", isPrimary: false,
})

export function NextOfKinSection({ memberId, memberCode, nextOfKin }: NextOfKinSectionProps) {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<NextOfKin | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NextOfKin | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())

  const field = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const openAdd = () => {
    setForm(emptyForm())
    setAddOpen(true)
  }

  const openEdit = (nok: NextOfKin) => {
    setForm({
      fullName: nok.fullName,
      relationship: nok.relationship ?? "",
      phone: nok.phone ?? "",
      email: nok.email ?? "",
      address: nok.address ?? "",
      isPrimary: nok.isPrimary,
    })
    setEditTarget(nok)
  }

  const handleAdd = async () => {
    if (!form.fullName.trim()) { toast.error("Full name is required"); return }
    setLoading(true)
    const res = await addNextOfKinAction(memberId, memberCode, {
      fullName: form.fullName.trim(),
      relationship: form.relationship || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      isPrimary: form.isPrimary,
    })
    setLoading(false)
    if (res.success) {
      toast.success("Next of kin added")
      setAddOpen(false)
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  const handleEdit = async () => {
    if (!editTarget) return
    if (!form.fullName.trim()) { toast.error("Full name is required"); return }
    setLoading(true)
    const res = await updateNextOfKinAction(editTarget.id, memberId, memberCode, {
      fullName: form.fullName.trim(),
      relationship: form.relationship || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      isPrimary: form.isPrimary,
    })
    setLoading(false)
    if (res.success) {
      toast.success("Updated")
      setEditTarget(null)
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setLoading(true)
    const res = await removeNextOfKinAction(deleteTarget.id, memberId, memberCode, deleteTarget.fullName)
    setLoading(false)
    if (res.success) {
      toast.success("Removed")
      setDeleteTarget(null)
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Next of Kin</h3>
        </div>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {nextOfKin.length === 0 ? (
        <p className="text-sm text-muted-foreground">No next of kin recorded.</p>
      ) : (
        <div className="space-y-3">
          {nextOfKin.map((nok) => (
            <div
              key={nok.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-foreground">{nok.fullName}</span>
                  {nok.isPrimary && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 border-amber-400 text-amber-600 dark:text-amber-400">
                      <Star className="h-2.5 w-2.5" />
                      Primary
                    </Badge>
                  )}
                  {nok.relationship && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{nok.relationship}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  {nok.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />{nok.phone}
                    </span>
                  )}
                  {nok.email && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />{nok.email}
                    </span>
                  )}
                  {nok.address && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{nok.address}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(nok)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(nok)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <NokDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Next of Kin"
        form={form}
        setForm={setForm}
        field={field}
        loading={loading}
        onSubmit={handleAdd}
        submitLabel="Add"
      />

      {/* Edit dialog */}
      <NokDialog
        open={!!editTarget}
        onOpenChange={(o) => { if (!o) setEditTarget(null) }}
        title="Edit Next of Kin"
        form={form}
        setForm={setForm}
        field={field}
        loading={loading}
        onSubmit={handleEdit}
        submitLabel="Save"
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Next of Kin?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{deleteTarget?.fullName}</strong> from this member's next of kin list?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Removing…</> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function NokDialog({
  open, onOpenChange, title, form, setForm, field, loading, onSubmit, submitLabel,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  field: (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => void
  loading: boolean
  onSubmit: () => void
  submitLabel: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="nok-name">Full Name *</Label>
            <Input id="nok-name" value={form.fullName} onChange={field("fullName")} placeholder="e.g. Jane Doe" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nok-rel">Relationship</Label>
              <Input
                id="nok-rel"
                value={form.relationship}
                onChange={field("relationship")}
                list="nok-rel-list"
                placeholder="e.g. Spouse"
              />
              <datalist id="nok-rel-list">
                {RELATIONSHIPS.map((r) => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nok-phone">Phone</Label>
              <Input id="nok-phone" value={form.phone} onChange={field("phone")} placeholder="+256…" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nok-email">Email</Label>
            <Input id="nok-email" type="email" value={form.email} onChange={field("email")} placeholder="optional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nok-address">Address</Label>
            <Input id="nok-address" value={form.address} onChange={field("address")} placeholder="optional" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
              className="rounded"
            />
            Mark as primary contact
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

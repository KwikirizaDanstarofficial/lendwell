"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  GitBranch, Plus, Pencil, Trash2, Loader2, Phone, Mail, MapPin,
  CheckCircle, XCircle, User,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  createBranchAction, updateBranchAction, deleteBranchAction,
} from "../actions"
import type { Branch } from "@/db/queries/branches"

interface BranchesTabProps {
  branches: Branch[]
  staff: { id: string; fullName: string; role: string }[]
}

type FormState = {
  name: string
  code: string
  address: string
  phone: string
  email: string
  managerId: string
}

const emptyForm = (): FormState => ({
  name: "", code: "", address: "", phone: "", email: "", managerId: "",
})

export function BranchesTab({ branches, staff }: BranchesTabProps) {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Branch | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())

  const field = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const openAdd = () => { setForm(emptyForm()); setAddOpen(true) }
  const openEdit = (b: Branch) => {
    setForm({
      name: b.name,
      code: b.code,
      address: b.address ?? "",
      phone: b.phone ?? "",
      email: b.email ?? "",
      managerId: b.managerId ?? "",
    })
    setEditTarget(b)
  }

  const handleAdd = async () => {
    if (!form.name.trim()) {
      toast.error("Branch name is required"); return
    }
    setLoading(true)
    const res = await createBranchAction({
      name: form.name.trim(),
      address: form.address || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      managerId: form.managerId || undefined,
    })
    setLoading(false)
    if (res.success) { toast.success("Branch created"); setAddOpen(false); router.refresh() }
    else toast.error(res.error)
  }

  const handleEdit = async () => {
    if (!editTarget) return
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Name and code are required"); return
    }
    setLoading(true)
    const res = await updateBranchAction(editTarget.id, {
      name: form.name.trim(),
      code: form.code.trim(),
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      managerId: form.managerId || null,
    })
    setLoading(false)
    if (res.success) { toast.success("Branch updated"); setEditTarget(null); router.refresh() }
    else toast.error(res.error)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setLoading(true)
    const res = await deleteBranchAction(deleteTarget.id)
    setLoading(false)
    if (res.success) { toast.success("Branch deleted"); setDeleteTarget(null); router.refresh() }
    else toast.error(res.error)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {branches.length} {branches.length === 1 ? "branch" : "branches"} configured
        </p>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Branch
        </Button>
      </div>

      {branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-muted-foreground">
          <GitBranch className="mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm font-medium">No branches yet</p>
          <p className="text-xs mt-1">Add a branch to assign members and staff to it</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="flex flex-col rounded-xl border border-border bg-card p-4 gap-3"
            >
              {/* Icon + status */}
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <GitBranch className="h-4 w-4" />
                </div>
                {branch.isActive ? (
                  <Badge className="text-[10px] px-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                    <CheckCircle className="mr-1 h-2.5 w-2.5" />Active
                  </Badge>
                ) : (
                  <Badge className="text-[10px] px-1.5 bg-muted text-muted-foreground border-0">
                    <XCircle className="mr-1 h-2.5 w-2.5" />Inactive
                  </Badge>
                )}
              </div>

              {/* Name + code */}
              <div className="flex-1 space-y-0.5">
                <p className="font-semibold text-sm leading-tight truncate">{branch.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{branch.code}</p>
              </div>

              {/* Details */}
              <div className="space-y-0.5">
                {branch.managerName && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                    <User className="h-3 w-3 shrink-0" />{branch.managerName}
                  </p>
                )}
                {branch.phone && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                    <Phone className="h-3 w-3 shrink-0" />{branch.phone}
                  </p>
                )}
                {branch.address && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                    <MapPin className="h-3 w-3 shrink-0" />{branch.address}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t pt-3 mt-auto">
                <a
                  href={`/branch/${branch.code}/login`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs px-2.5")}
                >
                  Login
                </a>
                <div className="flex items-center gap-0.5">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(branch)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon" variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(branch)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <BranchDialog
        open={addOpen} onOpenChange={setAddOpen}
        title="Add Branch"
        form={form} setForm={setForm} field={field}
        staff={staff} loading={loading}
        onSubmit={handleAdd} submitLabel="Create Branch"
      />

      {/* Edit dialog */}
      <BranchDialog
        open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null) }}
        title="Edit Branch"
        form={form} setForm={setForm} field={field}
        staff={staff} loading={loading}
        onSubmit={handleEdit} submitLabel="Save Changes"
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.name}</strong>? Members and staff assigned to this
              branch will have their branch cleared. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete} disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : "Delete Branch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function BranchDialog({
  open, onOpenChange, title, form, setForm, field, staff, loading, onSubmit, submitLabel,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  field: (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => void
  staff: { id: string; fullName: string; role: string }[]
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
            <Label htmlFor="br-name">Branch Name *</Label>
            <Input id="br-name" value={form.name} onChange={field("name")} placeholder="e.g. Kampala Branch" />
            {title === "Add Branch" && (
              <p className="text-xs text-muted-foreground">A unique code will be auto-generated from the name.</p>
            )}
          </div>
          {title === "Edit Branch" && (
            <div className="space-y-1.5">
              <Label htmlFor="br-code">Branch Code</Label>
              <Input id="br-code" value={form.code} onChange={field("code")} placeholder="e.g. KLA01" className="uppercase font-mono" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="br-manager">Branch Admin / Manager</Label>
            <Select
              value={form.managerId || "none"}
              onValueChange={(v) => setForm((f) => ({ ...f, managerId: !v || v === "none" ? "" : (v as string) }))}
            >
              <SelectTrigger id="br-manager">
                <SelectValue placeholder="Select manager (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No manager assigned</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="br-phone">Phone</Label>
            <Input id="br-phone" value={form.phone} onChange={field("phone")} placeholder="+256…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="br-email">Email</Label>
            <Input id="br-email" type="email" value={form.email} onChange={field("email")} placeholder="branch@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="br-address">Address</Label>
            <Input id="br-address" value={form.address} onChange={field("address")} placeholder="Physical address" />
          </div>
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

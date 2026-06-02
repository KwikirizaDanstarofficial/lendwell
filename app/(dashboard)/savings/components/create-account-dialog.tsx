"use client"

import { useState } from "react"
import { toast } from "sonner"
import { usePowerSync } from "@powersync/react"
import { createSavingsAccountAction } from "../actions"
import { offlineCreateSavingsAccount } from "@/lib/powersync/offline-mutations"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, PiggyBank } from "lucide-react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { isOffline } from "@/lib/utils/is-offline"

export function CreateAccountDialog({
  open,
  onClose,
  members,
  categories,
  saccoId = "",
}: {
  open: boolean
  onClose: () => void
  members: any[]
  categories: any[]
  saccoId?: string
}) {
  const db = usePowerSync()
  const [isPending, setIsPending] = useState(false)

  // Track all form values as state — FormData from Radix/Shadcn components
  // (Select, SearchableSelect) is unreliable inside a Dialog portal.
  const [selectedMemberId,   setSelectedMemberId]   = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [accountType,        setAccountType]        = useState("regular")
  const [initialDeposit,     setInitialDeposit]     = useState("")

  const resetForm = () => {
    setSelectedMemberId("")
    setSelectedCategoryId("")
    setAccountType("regular")
    setInitialDeposit("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const saveOffline = async () => {
    if (!selectedMemberId) { toast.error("Please select a member."); return }
    await offlineCreateSavingsAccount(db, saccoId, {
      member_id:       selectedMemberId,
      category_id:     selectedCategoryId || null,
      account_type:    accountType || "regular",
      initial_deposit: Number(initialDeposit) || 0,
    })
    toast.success("Savings account saved offline — will sync when reconnected")
    handleClose()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedMemberId) { toast.error("Please select a member."); return }

    if (isOffline()) {
      await saveOffline().catch(() => toast.error("Failed to save offline."))
      return
    }

    setIsPending(true)
    try {
      // Build FormData from current state values (Radix components don't populate
      // the native form's FormData automatically)
      const fd = new FormData()
      fd.set("member_id",       selectedMemberId)
      fd.set("category_id",     selectedCategoryId)
      fd.set("account_type",    accountType)
      fd.set("initial_deposit", initialDeposit || "0")

      const result = await createSavingsAccountAction({}, fd)
      if (result.success) {
        toast.success("Savings account created!")
        handleClose()
      } else if (result.offline) {
        await saveOffline().catch(() => toast.error("Failed to save offline."))
      } else {
        toast.error(result.error || "Failed to create savings account")
      }
    } catch {
      // Network/server error — fall back to offline save
      await saveOffline().catch(() => toast.error("Failed to save offline."))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Create Savings Account
          </DialogTitle>
          <DialogDescription>
            Open a new savings account for a member.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Member *</Label>
            <SearchableSelect
              placeholder="Select member"
              searchPlaceholder="Search by name or code..."
              options={members.map((m) => ({
                value: m.id,
                label: m.fullName,
                sub: m.memberCode,
              }))}
              value={selectedMemberId}
              onChange={setSelectedMemberId}
            />
          </div>

          {categories.length > 0 && (
            <div className="space-y-1.5">
              <Label>Savings Category</Label>
              <SearchableSelect
                placeholder="Select category (optional)"
                searchPlaceholder="Search category..."
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                  sub: c.interestRate ? `${c.interestRate}% interest` : undefined,
                }))}
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Account Type</Label>
            <Select value={accountType} onValueChange={(v) => setAccountType(v ?? "regular")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="fixed">Fixed Deposit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Initial Deposit (UGX)</Label>
            <Input
              type="number"
              placeholder="e.g. 50000 (optional)"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

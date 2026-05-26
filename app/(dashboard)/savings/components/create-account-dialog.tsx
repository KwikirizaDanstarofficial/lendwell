"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { createSavingsAccountAction } from "../actions"
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

export function CreateAccountDialog({
  open,
  onClose,
  members,
  categories,
}: {
  open: boolean
  onClose: () => void
  members: any[]
  categories: any[]
}) {
  const [state, formAction, isPending] = useActionState(
    createSavingsAccountAction,
    {}
  )

  useEffect(() => {
    if (state.success) {
      toast.success("Savings account created!")
      onClose()
    }
    if (state.error) toast.error(state.error)
  }, [state, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
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

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Member *</Label>
            <SearchableSelect
              name="member_id"
              required
              placeholder="Select member"
              searchPlaceholder="Search by name or code..."
              options={members.map((m) => ({
                value: m.id,
                label: m.fullName,
                sub: m.memberCode,
              }))}
            />
          </div>

          {categories.length > 0 && (
            <div className="space-y-1.5">
              <Label>Savings Category</Label>
              <SearchableSelect
                name="category_id"
                placeholder="Select category (optional)"
                searchPlaceholder="Search category..."
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                  sub: c.interestRate ? `${c.interestRate}% interest` : undefined,
                }))}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Account Type</Label>
            <Select name="account_type" defaultValue="regular">
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
              name="initial_deposit"
              type="number"
              placeholder="e.g. 50000 (optional)"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
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
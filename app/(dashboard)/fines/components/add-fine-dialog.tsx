"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { addFineAction } from "../actions"
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

import { Loader2, AlertCircle } from "lucide-react"
import { formatUGX } from "@/lib/utils/format"
import { SearchableSelect } from "@/components/ui/searchable-select"

export function AddFineDialog({
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
  const [state, formAction, isPending] = useActionState(addFineAction, {})

  useEffect(() => {
    if (state.success) {
      toast.success("Fine issued successfully! Member notified via SMS.")
      onClose()
    }
    if (state.error) toast.error(state.error)
  }, [state, onClose])

  const fieldError = (field: string) => (state as any).fieldErrors?.[field]?.[0]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Issue Fine
          </DialogTitle>
          <DialogDescription>
            Issue a fine to a member. An SMS will be sent automatically.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {/* Member */}
          <div className="space-y-1.5">
            <Label>Member *</Label>
            <SearchableSelect
              name="member_id"
              required
              placeholder="Select member"
              searchPlaceholder="Search by name or code..."
              options={members.map((m) => ({
                value: m.id,
                label: m.full_name,
                sub: m.member_code,
              }))}
            />
            {fieldError("member_id") && (
              <p className="text-sm text-destructive">
                {fieldError("member_id")}
              </p>
            )}
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div className="space-y-1.5">
              <Label>Fine Category</Label>
              <SearchableSelect
                name="category_id"
                placeholder="Select category (optional)"
                searchPlaceholder="Search category..."
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                  sub: c.defaultAmount > 0 ? formatUGX(c.defaultAmount) : undefined,
                }))}
              />
            </div>
          )}

          {/* Amount + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Amount (UGX) *</Label>
              <Input name="amount" type="number" placeholder="e.g. 50000" />
              {fieldError("amount") && (
                <p className="text-sm text-destructive">
                  {fieldError("amount")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select name="priority" defaultValue="normal">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label>Reason *</Label>
            <Input name="reason" placeholder="e.g. Late loan repayment" />
            {fieldError("reason") && (
              <p className="text-sm text-destructive">{fieldError("reason")}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea
              name="description"
              rows={2}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              placeholder="Detailed description (optional)"
            />
          </div>

          {/* Due Date + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input
                name="due_date"
                type="date"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Internal Notes</Label>
              <Input name="notes" placeholder="Optional notes" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Issue Fine
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

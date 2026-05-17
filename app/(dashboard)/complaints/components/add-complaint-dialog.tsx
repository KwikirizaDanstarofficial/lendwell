"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { addComplaintAction, type ComplaintFormState } from "../actions"

type MemberSelect = {
  id: string
  full_name: string
  member_code: string
  phone: string | null
}
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
import { Loader2, MessageSquare } from "lucide-react"

const initialState: ComplaintFormState = {}

export function AddComplaintDialog({
  open,
  onClose,
  members,
}: {
  open: boolean
  onClose: () => void
  members: MemberSelect[]
}) {
  const [state, formAction, isPending] = useActionState(
    addComplaintAction,
    initialState
  )

  useEffect(() => {
    if (state.success) {
      toast.success("Complaint submitted! Member notified via SMS.")
      onClose()
    }
    if (state.error) toast.error(state.error)
  }, [state, onClose])

  const fieldError = (field: string) => state.fieldErrors?.[field]?.[0]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            New Complaint
          </DialogTitle>
          <DialogDescription>
            Submit a new complaint or issue from a member.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {/* Member */}
          <div className="space-y-1.5">
            <Label>Member (Optional)</Label>
            <Select name="member_id">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select member or leave anonymous" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name} · {m.member_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Brief subject of the complaint"
            />
            {fieldError("subject") && (
              <p className="text-sm text-destructive">
                {fieldError("subject")}
              </p>
            )}
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select name="category" defaultValue="general">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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

          {/* Body */}
          <div className="space-y-1.5">
            <Label htmlFor="body">Description *</Label>
            <textarea
              id="body"
              name="body"
              rows={4}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              placeholder="Describe the complaint in detail..."
            />
            {fieldError("body") && (
              <p className="text-sm text-destructive">{fieldError("body")}</p>
            )}
          </div>

          {/* Internal Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Internal Notes</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="Optional internal notes (not sent to member)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="mr-2 h-4 w-4" />
              )}
              Submit Complaint
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { addComplaintAction } from "../actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MessageSquare, Loader2 } from "lucide-react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { categoryLabels } from "./complaints-client"

type MemberSelect = {
  id: string
  full_name: string
  member_code: string
  phone: string | null
}

export function AddComplaintDialog({
  open,
  onClose,
  members,
  saccoId,
}: {
  open: boolean
  onClose: () => void
  members: MemberSelect[]
  saccoId: string
}) {
  const [state, formAction, isPending] = useActionState(addComplaintAction, {})

  useEffect(() => {
    if (state.success) {
      toast.success("Complaint submitted successfully!")
      onClose()
    }
    if (state.error && state.error !== "offline") toast.error(state.error)
  }, [state, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Add Complaint
          </DialogTitle>
          <DialogDescription>
            Record a new complaint from a member.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="sacco_id" value={saccoId} />

          <div className="space-y-1.5">
            <Label>Member (optional)</Label>
            <SearchableSelect
              name="member_id"
              options={members.map((m) => ({
                value: m.id,
                label: m.full_name,
                sub: m.member_code,
              }))}
              placeholder="Search member..."
              searchPlaceholder="Search by name or code..."
              emptyText="No members found."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Brief subject of the complaint"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body">Description *</Label>
            <textarea
              id="body"
              name="body"
              className="min-h-[100px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Describe the complaint in detail..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select name="category" defaultValue="general">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select name="priority" defaultValue="normal">
                <SelectTrigger>
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

          <div className="space-y-1.5">
            <Label htmlFor="notes">Internal Notes (optional)</Label>
            <textarea
              id="notes"
              name="notes"
              className="min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Private notes for staff..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              Submit Complaint
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

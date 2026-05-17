"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { resolveComplaintAction } from "../actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CheckCircle, Loader2 } from "lucide-react"

export function ResolveDialog({
  complaint,
  open,
  onClose,
}: {
  complaint: any
  open: boolean
  onClose: () => void
}) {
  const [state, formAction, isPending] = useActionState(
    resolveComplaintAction,
    {}
  )

  useEffect(() => {
    if (state.success) {
      toast.success("Complaint resolved! SMS sent to member.")
      onClose()
    }
    if (state.error) toast.error(state.error)
  }, [state, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Resolve Complaint
          </DialogTitle>
          <DialogDescription>
            {complaint.complaintRef} · {complaint.subject}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={complaint.id} />

          <div className="space-y-1.5">
            <Label htmlFor="resolution_notes">Resolution Notes *</Label>
            <textarea
              id="resolution_notes"
              name="resolution_notes"
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Describe how this complaint was resolved..."
            />
            <p className="text-xs text-muted-foreground">
              This message will be sent to the member via SMS.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Mark as Resolved
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
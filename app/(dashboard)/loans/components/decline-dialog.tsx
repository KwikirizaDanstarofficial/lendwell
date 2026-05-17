// app/(dashboard)/loans/components/decline-dialog.tsx
"use client"

import { useState } from "react"
import { toast } from "sonner"
import { declineLoanAction } from "../actions"
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
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export function DeclineDialog({
  loan,
  open,
  onClose,
}: {
  loan: any
  open: boolean
  onClose: () => void
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDecline = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for declining")
      return
    }
    setLoading(true)
    const res = await declineLoanAction(loan.id, reason)
    setLoading(false)
    if (res.success) {
      toast.success("Loan declined")
      onClose()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Decline Loan Application</DialogTitle>
          <DialogDescription>
            Loan: {loan.loanRef} · Member: {loan.member_name} · Amount: {formatUGX(loan.amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason for Declining *</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Insufficient collateral, Poor credit history, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Decline Loan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add import for formatUGX
import { formatUGX } from "@/lib/utils/format"
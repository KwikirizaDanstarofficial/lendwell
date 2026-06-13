// app/(dashboard)/loans/components/decline-dialog.tsx
// Dialog for declining a pending loan application with a mandatory reason.
// Calls declineLoanAction and notifies the member via SMS (server-side).
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { formatUGX } from "@/lib/utils/format"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Divisor to convert stored cent amounts to UGX for display. */
const CENTS_PER_UNIT = 100

/** Number of visible rows in the reason textarea. */
const REASON_TEXTAREA_ROWS = 3

// ─── Component ────────────────────────────────────────────────────────────────

export function DeclineDialog({
  loan,
  open,
  onClose,
}: {
  loan:    any
  open:    boolean
  onClose: () => void
}) {
  const [reason,  setReason]  = useState("")
  const [loading, setLoading] = useState(false)

  const handleDecline = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for declining")
      return
    }

    setLoading(true)
    const result = await declineLoanAction(loan.id, reason)
    setLoading(false)

    if (result.success) {
      toast.success("Loan declined")
      onClose()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Decline Loan Application</DialogTitle>
          <DialogDescription>
            Loan: {loan.loanRef} · Member: {loan.member_name} · Amount:{" "}
            {formatUGX(loan.amount / CENTS_PER_UNIT)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason for Declining *</Label>
            <Textarea
              id="reason"
              placeholder="e.g. Insufficient collateral, Poor credit history, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={REASON_TEXTAREA_ROWS}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDecline} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Decline Loan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED COMPONENTS:
//   DeclineDialog({ loan, open, onClose })
//     – modal for declining a pending loan with a mandatory reason
//     – the server action sends an SMS to the member
//
// KEY CONSTANTS:
//   CENTS_PER_UNIT         = 100
//   REASON_TEXTAREA_ROWS   = 3
//
// RELATED FILES:
//   ../actions.ts        – declineLoanAction server action
//   lib/utils/format.ts  – formatUGX()

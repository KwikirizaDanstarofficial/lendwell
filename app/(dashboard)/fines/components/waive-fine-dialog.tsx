"use client"

import { useState } from "react"
import { toast } from "sonner"
import { waiveFineAction } from "../actions"
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
import { formatUGX } from "@/lib/utils/format"
import { Loader2, XCircle } from "lucide-react"

export function WaiveFineDialog({
  fine,
  open,
  onClose,
}: {
  fine: any
  open: boolean
  onClose: () => void
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleWaive = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for waiving")
      return
    }
    setLoading(true)
    const res = await waiveFineAction(fine.id, reason)
    setLoading(false)
    if (res.success) {
      toast.success("Fine waived. Member notified via SMS.")
      onClose()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-gray-500" />
            Waive Fine
          </DialogTitle>
          <DialogDescription>
            {fine.fineRef} · {fine.member_name} ·{" "}
            <span className="font-semibold text-foreground">
              {formatUGX(fine.amount)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Reason for Waiving *</Label>
            <Input
              placeholder="e.g. Member hardship, management decision"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleWaive}
              disabled={loading}
              variant="secondary"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Waive Fine
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
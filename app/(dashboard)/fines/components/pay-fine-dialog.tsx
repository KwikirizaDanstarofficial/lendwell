"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { usePowerSync } from "@powersync/react"
import { markFinePaidAction } from "../actions"
import { offlineMarkFinePaid } from "@/lib/powersync/offline-mutations"
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
import { formatUGX } from "@/lib/utils/format"
import { Loader2, CheckCircle } from "lucide-react"
import { ReceiptDialog } from "@/components/receipts/receipt-dialog"
import type { ReceiptData } from "@/types/receipt"
import { isOffline } from "@/lib/utils/is-offline"

export function PayFineDialog({
  fine,
  open,
  onClose,
}: {
  fine: any
  open: boolean
  onClose: () => void
}) {
  const db = usePowerSync()
  const [state, formAction, isPending] = useActionState(markFinePaidAction, {} as { success?: boolean; error?: string; offline?: boolean; receipt?: ReceiptData })
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [offlineSuccess, setOfflineSuccess] = useState(false)
  const lastMethodRef = useRef<string>("cash")

  useEffect(() => {
    if (offlineSuccess) { onClose(); return }
    if (state.offline) {
      offlineMarkFinePaid(db, fine.id, lastMethodRef.current)
        .then(() => { toast.success("Fine marked as paid offline — will sync when connected."); setOfflineSuccess(true) })
        .catch(() => toast.error("Failed to save offline."))
      return
    }
    if (state.success && state.receipt) { setReceipt(state.receipt); onClose() }
    if (state.error) toast.error(state.error)
  }, [state, onClose, offlineSuccess, db, fine])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget)
    lastMethodRef.current = (fd.get("payment_method") as string) || "cash"
    if (isOffline()) {
      e.preventDefault()
      offlineMarkFinePaid(db, fine.id, lastMethodRef.current)
        .then(() => { toast.success("Fine marked as paid offline — will sync when connected."); setOfflineSuccess(true) })
        .catch(() => toast.error("Failed to save offline."))
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Mark Fine as Paid
            </DialogTitle>
            <DialogDescription>
              {fine.fineRef} · {fine.member_name} ·{" "}
              <span className="font-semibold text-foreground">
                {formatUGX(fine.amount)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="fine_id" value={fine.id} />

            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select name="payment_method" defaultValue="cash">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Reference</Label>
              <Input
                name="payment_reference"
                placeholder="Transaction ref (optional)"
              />
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
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {receipt && (
        <ReceiptDialog
          open={!!receipt}
          onClose={() => setReceipt(null)}
          receipt={receipt}
        />
      )}
    </>
  )
}

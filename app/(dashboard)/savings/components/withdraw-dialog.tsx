// app/(dashboard)/savings/components/withdraw-dialog.tsx
// Dialog for processing a savings withdrawal from a member's account.
// Submits via server action and shows a receipt on success.
"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { usePowerSync } from "@powersync/react"
import { withdrawAction } from "../actions"
import { offlineWithdraw } from "@/lib/powersync/offline-mutations"
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
import { Loader2, Minus } from "lucide-react"
import { ReceiptDialog } from "@/components/receipts/receipt-dialog"
import type { ReceiptData } from "@/types/receipt"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default payment method pre-selected in the dropdown. */
const DEFAULT_PAYMENT_METHOD = "cash"

/** Divisor to convert stored cent amounts to UGX for the placeholder max hint. */
const CENTS_PER_UNIT = 100

const INITIAL_ACTION_STATE: { success?: boolean; error?: string; receipt?: ReceiptData } = {}

// ─── Component ────────────────────────────────────────────────────────────────

export function WithdrawDialog({
  account,
  open,
  onClose,
}: {
  account: any
  open:    boolean
  onClose: () => void
}) {
  const db = usePowerSync()
  const [state, formAction, isPending] = useActionState(withdrawAction, INITIAL_ACTION_STATE)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [offlineSuccess, setOfflineSuccess] = useState(false)

  useEffect(() => {
    if (offlineSuccess) { onClose(); return }
    if (state.success && state.receipt) { setReceipt(state.receipt); onClose() }
    if (state.error) toast.error(state.error)
  }, [state, onClose, offlineSuccess])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!navigator.onLine) {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const amount = Number(fd.get("amount"))
      if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return }
      offlineWithdraw(db, account.sacco_id ?? "", account.id, account.memberId ?? account.member_id ?? "", amount, (fd.get("narration") as string) || undefined)
        .then(() => { toast.success("Withdrawal saved offline — will sync when connected."); setOfflineSuccess(true) })
        .catch(() => toast.error("Failed to save offline."))
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Minus className="h-5 w-5 text-orange-600" />
              Withdraw Savings
            </DialogTitle>
            <DialogDescription>
              {account.accountNumber} · {account.member_name} · Available:{" "}
              <span className="font-semibold text-foreground">
                {formatUGX(account.balance)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="account_id" value={account.id} />

            <div className="space-y-1.5">
              <Label>Amount (UGX) *</Label>
              <Input
                name="amount"
                type="number"
                placeholder={`Max: ${account.balance / CENTS_PER_UNIT}`}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select name="payment_method" defaultValue={DEFAULT_PAYMENT_METHOD}>
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
              <Label>Narration</Label>
              <Input name="narration" placeholder="Reason for withdrawal" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Process Withdrawal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt shown after a successful withdrawal */}
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

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED COMPONENTS:
//   WithdrawDialog({ account, open, onClose })
//     – modal for processing a savings withdrawal
//     – placeholder shows the account's available balance as the max
//     – triggers ReceiptDialog on success
//
// KEY CONSTANTS:
//   DEFAULT_PAYMENT_METHOD = "cash"
//   CENTS_PER_UNIT         = 100
//
// RELATED FILES:
//   ../actions.ts                         – withdrawAction server action
//   components/receipts/receipt-dialog.tsx – receipt display
//   lib/utils/format.ts                   – formatUGX()

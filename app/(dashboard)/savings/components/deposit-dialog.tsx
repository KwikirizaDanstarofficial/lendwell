"use client"
// app/(dashboard)/savings/components/deposit-dialog.tsx
// Dialog for recording a savings deposit on a member's account.
// Submits via server action and shows a receipt on success.
"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { usePowerSync } from "@powersync/react"
import { depositAction } from "../actions"
import { offlineDeposit } from "@/lib/powersync/offline-mutations"
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
import { Loader2, Plus } from "lucide-react"
import { ReceiptDialog } from "@/components/receipts/receipt-dialog"
import type { ReceiptData } from "@/types/receipt"
import { isOffline } from "@/lib/utils/is-offline"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default payment method pre-selected in the dropdown. */
const DEFAULT_PAYMENT_METHOD = "cash"

const INITIAL_ACTION_STATE: { success?: boolean; error?: string; offline?: boolean; receipt?: ReceiptData } = {}

// ─── Component ────────────────────────────────────────────────────────────────

export function DepositDialog({
  account,
  open,
  onClose,
}: {
  account: any
  open:    boolean
  onClose: () => void
}) {
  const db = usePowerSync()
  const [state, formAction, isPending] = useActionState(depositAction, INITIAL_ACTION_STATE)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [offlineSuccess, setOfflineSuccess] = useState(false)
  // Capture the last submitted form values so the offline fallback can use them
  const lastSubmitRef = useRef<{ amount: number; narration?: string } | null>(null)

  useEffect(() => {
    if (offlineSuccess) { onClose(); return }
    if (state.offline) {
      // Server action detected network failure — fall back to local SQLite
      // lastSubmitRef.current.amount is raw UGX; DB stores cents — multiply by 100
      const { amount = 0, narration } = lastSubmitRef.current ?? {}
      if (amount > 0) {
        offlineDeposit(db, account.sacco_id ?? "", account.id, account.memberId ?? account.member_id ?? "", Math.round(amount * 100), narration)
          .then(() => { toast.success("Deposit saved offline — will sync when connected."); setOfflineSuccess(true) })
          .catch(() => toast.error("Failed to save offline."))
      }
      return
    }
    if (state.success && state.receipt) { setReceipt(state.receipt); onClose() }
    if (state.error && state.error !== "offline") toast.error(state.error)
  }, [state, onClose, offlineSuccess, db, account])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget)
    const amount = Number(fd.get("amount"))
    const narration = (fd.get("narration") as string) || undefined
    // Always capture values for the server-action offline fallback path
    lastSubmitRef.current = { amount, narration }
    if (isOffline()) {
      e.preventDefault()
      if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return }
      // DB stores amounts in cents; user enters UGX — multiply by 100
      offlineDeposit(db, account.sacco_id ?? "", account.id, account.memberId ?? account.member_id ?? "", Math.round(amount * 100), narration)
        .then(() => { toast.success("Deposit saved offline — will sync when connected."); setOfflineSuccess(true) })
        .catch(() => toast.error("Failed to save offline."))
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Deposit Savings
            </DialogTitle>
            <DialogDescription>
              {account.accountNumber} · {account.member_name} · Current balance:{" "}
              <span className="font-semibold text-foreground">
                {formatUGX(account.balance)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="account_id" value={account.id} />

            <div className="space-y-1.5">
              <Label>Amount (UGX) *</Label>
              <Input name="amount" type="number" placeholder="e.g. 100000" />
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
              <Input name="narration" placeholder="e.g. Monthly savings" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Deposit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt shown after a successful deposit */}
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
//   DepositDialog({ account, open, onClose })
//     – modal for recording a savings deposit
//     – triggers ReceiptDialog on success
//
// KEY CONSTANTS:
//   DEFAULT_PAYMENT_METHOD = "cash"
//
// RELATED FILES:
//   ../actions.ts                         – depositAction server action
//   components/receipts/receipt-dialog.tsx – receipt display
//   lib/utils/format.ts                   – formatUGX()

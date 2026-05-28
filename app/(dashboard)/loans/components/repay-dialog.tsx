// app/(dashboard)/loans/components/repay-dialog.tsx
"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { repayLoanAction, LoanFormState } from "../actions"
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
import { Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReceiptDialog } from "@/components/receipts/receipt-dialog"
import type { ReceiptData } from "@/types/receipt"

const initialState: LoanFormState = {}

export function RepayDialog({
  loan,
  open,
  onClose,
}: {
  loan: any
  open: boolean
  onClose: () => void
}) {
  const [state, formAction, isPending] = useActionState(
    repayLoanAction,
    initialState
  )
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)

  useEffect(() => {
    if (state.success && state.receipt) {
      setReceipt(state.receipt)
      onClose()
    }
    if (state.error) toast.error(state.error)
  }, [state, onClose])

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Repayment</DialogTitle>
            <DialogDescription>
              Loan: {loan.loanRef} · Balance:{" "}
              <span className="font-semibold text-foreground">
                {formatUGX(loan.balance)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="loan_id" value={loan.id} />

            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
                <p className="text-xs text-muted-foreground">Daily</p>
                <p className="font-bold text-blue-600">
                  {formatUGX(loan.dailyPayment ?? 0)}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                <p className="text-xs text-muted-foreground">Monthly</p>
                <p className="font-bold text-green-600">
                  {formatUGX(loan.monthlyPayment ?? 0)}
                </p>
              </div>
              <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950/30">
                <p className="text-xs text-muted-foreground">Min Payment</p>
                <p className="font-bold text-orange-600">
                  {formatUGX(loan.dailyPayment ?? 0)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount to Pay (UGX)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder={`Max: ${loan.balance / 100}`}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select name="payment_method" defaultValue="mobile_money">
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

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
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

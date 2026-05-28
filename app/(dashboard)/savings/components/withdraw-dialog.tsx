"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { withdrawAction } from "../actions"
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

export function WithdrawDialog({
  account,
  open,
  onClose,
}: {
  account: any
  open: boolean
  onClose: () => void
}) {
  const [state, formAction, isPending] = useActionState(withdrawAction, {})
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

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="account_id" value={account.id} />

            <div className="space-y-1.5">
              <Label>Amount (UGX) *</Label>
              <Input
                name="amount"
                type="number"
                placeholder={`Max: ${account.balance / 100}`}
              />
            </div>

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
              <Label>Narration</Label>
              <Input name="narration" placeholder="Reason for withdrawal" />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Process Withdrawal
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

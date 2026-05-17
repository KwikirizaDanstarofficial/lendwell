"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { depositAction } from "../actions"
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

export function DepositDialog({
  account,
  open,
  onClose,
}: {
  account: any
  open: boolean
  onClose: () => void
}) {
  const [state, formAction, isPending] = useActionState(depositAction, {})

  useEffect(() => {
    if (state.success) {
      toast.success("Deposit recorded successfully!")
      onClose()
    }
    if (state.error) toast.error(state.error)
  }, [state, onClose])

  return (
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

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="account_id" value={account.id} />

          <div className="space-y-1.5">
            <Label>Amount (UGX) *</Label>
            <Input
              name="amount"
              type="number"
              placeholder="e.g. 100000"
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
            <Input
              name="narration"
              placeholder="e.g. Monthly savings"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Deposit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
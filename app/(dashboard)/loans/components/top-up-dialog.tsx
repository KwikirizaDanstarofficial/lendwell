// app/(dashboard)/loans/components/top-up-dialog.tsx
"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { usePowerSync } from "@powersync/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { topUpLoanAction, LoanFormState } from "../actions"
import { offlineTopUpLoan } from "@/lib/powersync/offline-mutations"
import { isOffline } from "@/lib/utils/is-offline"

type Loan = {
  id: string
  saccoId: string
  memberId: string
  categoryId: string | null
  loanRef: string
  amount: number
  balance: number
  interestRate: string
  status: string
  dueDate: string | null
  disbursedAt: string | null
  settledAt: string | null
  declineReason: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  interestRateId: string | null
  expectedReceived: number
  interestType: string
  durationMonths: number
  latePenaltyFee: number
  dailyPayment: number
  monthlyPayment: number
}

interface TopUpDialogProps {
  loan: Loan | null
  open: boolean
  onClose: () => void
}

const initialState: LoanFormState = {}

export function TopUpDialog({ loan, open, onClose }: TopUpDialogProps) {
  const db = usePowerSync()
  const [state, formAction, isPending] = useActionState(
    topUpLoanAction,
    initialState
  )
  const [offlineSuccess, setOfflineSuccess] = useState(false)
  const lastSubmitRef = useRef<{ amount: number; reason?: string } | null>(null)

  useEffect(() => {
    if (offlineSuccess) { onClose(); return }
    if (state.success) {
      toast.success("Top up recorded successfully!")
      onClose()
    }
    if (state.offline) {
      // lastSubmitRef.current.amount is raw UGX; DB stores cents — multiply by 100
      const { amount = 0, reason } = lastSubmitRef.current ?? {}
      if (amount > 0 && loan) {
        offlineTopUpLoan(db, loan.saccoId, loan.id, loan.memberId, Math.round(amount * 100), reason)
          .then(() => { toast.success("Top-up saved offline — will sync when connected."); setOfflineSuccess(true) })
          .catch(() => toast.error("Failed to save offline."))
      }
      return
    }
    if (state.error) toast.error(state.error)
  }, [state, onClose, offlineSuccess, db, loan])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget)
    const amount = Number(fd.get("amount"))
    const reason = (fd.get("reason") as string) || undefined
    lastSubmitRef.current = { amount, reason }
    if (isOffline()) {
      e.preventDefault()
      if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return }
      if (!loan) return
      // DB stores amounts in cents; user enters UGX — multiply by 100
      offlineTopUpLoan(db, loan.saccoId, loan.id, loan.memberId, Math.round(amount * 100), reason)
        .then(() => { toast.success("Top-up saved offline — will sync when connected."); setOfflineSuccess(true) })
        .catch(() => toast.error("Failed to save offline."))
    }
  }

  if (!loan) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Top Up Loan</DialogTitle>
          <DialogDescription>
            Loan: {loan.loanRef} · Current Balance:{" "}
            <span className="font-semibold text-foreground">
              {formatUGX(loan.balance)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="loan_id" value={loan.id} />

          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
              <p className="text-xs text-muted-foreground">Small Top Up</p>
              <p className="font-bold text-blue-600">{formatUGX(50000)}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
              <p className="text-xs text-muted-foreground">Medium Top Up</p>
              <p className="font-bold text-green-600">{formatUGX(100000)}</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950/30">
              <p className="text-xs text-muted-foreground">Large Top Up</p>
              <p className="font-bold text-orange-600">{formatUGX(200000)}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Top-up Amount (UGX)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="Enter amount"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason *</Label>
            <Input
              id="reason"
              name="reason"
              placeholder="e.g., Additional purchase, Emergency funds"
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
              Top Up Loan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

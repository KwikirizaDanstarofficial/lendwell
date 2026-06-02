"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { usePowerSync } from "@powersync/react"
import { trimToLoanAction } from "../actions"
import { offlineTrimToLoan } from "@/lib/powersync/offline-mutations"
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
import { Loader2, Scissors } from "lucide-react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { isOffline } from "@/lib/utils/is-offline"

export function TrimLoanDialog({
  account,
  loans,
  open,
  onClose,
}: {
  account: any
  loans: any[]
  open: boolean
  onClose: () => void
}) {
  const db = usePowerSync()
  const [state, formAction, isPending] = useActionState(trimToLoanAction, {} as { success?: boolean; error?: string; offline?: boolean })
  const [selectedLoan, setSelectedLoan] = useState<any>(null)
  const [offlineSuccess, setOfflineSuccess] = useState(false)
  const lastSubmitRef = useRef<{ loan_id?: string; amount?: number } | null>(null)

  useEffect(() => {
    if (offlineSuccess) { onClose(); return }
    if (state.success) {
      toast.success("Savings trimmed to loan successfully!")
      onClose()
    }
    if (state.offline) {
      // lastSubmitRef.current.amount is raw UGX; DB stores cents — multiply by 100
      const { loan_id, amount = 0 } = lastSubmitRef.current ?? {}
      if (amount > 0 && loan_id) {
        offlineTrimToLoan(db, account.sacco_id ?? "", account.id, account.member_id ?? account.memberId ?? "", loan_id, Math.round(amount * 100))
          .then(() => { toast.success("Trim saved offline — will sync when connected."); setOfflineSuccess(true) })
          .catch(() => toast.error("Failed to save offline."))
      }
      return
    }
    if (state.error) toast.error(state.error)
  }, [state, onClose, offlineSuccess, db, account])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget)
    const loan_id = fd.get("loan_id") as string
    const amount = Number(fd.get("amount"))
    lastSubmitRef.current = { loan_id, amount }
    if (isOffline()) {
      e.preventDefault()
      if (!loan_id) { toast.error("Please select a loan."); return }
      if (!amount || amount <= 0) { toast.error("Enter a valid amount."); return }
      // DB stores amounts in cents; user enters UGX — multiply by 100
      offlineTrimToLoan(db, account.sacco_id ?? "", account.id, account.member_id ?? account.memberId ?? "", loan_id, Math.round(amount * 100))
        .then(() => { toast.success("Trim saved offline — will sync when connected."); setOfflineSuccess(true) })
        .catch(() => toast.error("Failed to save offline."))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-blue-600" />
            Trim Savings to Loan
          </DialogTitle>
          <DialogDescription>
            Apply savings balance toward a loan repayment for {account.member_name}.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="account_id" value={account.id} />

          {/* Savings Balance */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Savings Balance</p>
              <p className="font-bold text-green-600">{formatUGX(account.balance)}</p>
            </div>
            {selectedLoan && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Loan Balance</p>
                <p className="font-bold text-orange-600">
                  {formatUGX(selectedLoan.balance)}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Select Loan *</Label>
            <SearchableSelect
              name="loan_id"
              required
              placeholder="Select active loan"
              searchPlaceholder="Search by loan reference..."
              onChange={(val) => {
                const loan = loans.find((l) => l.id === val)
                setSelectedLoan(loan)
              }}
              options={loans.map((l) => ({
                value: l.id,
                label: l.loanRef,
                sub: `${formatUGX(l.balance)} remaining`,
              }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Amount to Trim (UGX) *</Label>
            <Input
              name="amount"
              type="number"
              placeholder={`Max: ${account.balance / 100}`}
            />
            <p className="text-xs text-muted-foreground">
              Amount will be deducted from savings and applied to the loan.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Trim to Loan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
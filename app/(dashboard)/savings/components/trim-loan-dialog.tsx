"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { trimToLoanAction } from "../actions"
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
  const [state, formAction, isPending] = useActionState(trimToLoanAction, {})
  const [selectedLoan, setSelectedLoan] = useState<any>(null)

  useEffect(() => {
    if (state.success) {
      toast.success("Savings trimmed to loan successfully!")
      onClose()
    }
    if (state.error) toast.error(state.error)
  }, [state, onClose])

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

        <form action={formAction} className="space-y-4">
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
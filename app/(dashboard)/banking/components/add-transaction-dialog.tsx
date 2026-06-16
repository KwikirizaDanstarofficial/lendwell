"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { usePowerSync } from "@powersync/react"
import { offlineRecordBankingTransaction } from "@/lib/powersync/offline-mutations"
import { isOffline } from "@/lib/utils/is-offline"
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
import { Loader2, ArrowLeftRight } from "lucide-react"

type DialogState = { success?: boolean; error?: string }
const INITIAL_STATE: DialogState = {}

export function AddTransactionDialog({
  open, onClose, saccoId, bankAccounts,
}: {
  open: boolean; onClose: () => void; saccoId: string
  bankAccounts: { id: string; bankName: string; accountName: string; accountNumber: string }[]
}) {
  const db = usePowerSync()
  const [state, formAction, isPending] = useActionState(
    async (prev: any, fd: FormData) => {
      if (isOffline()) return { success: true }
      const { addBankingTransactionAction } = await import("../actions")
      return addBankingTransactionAction(prev, fd)
    }, INITIAL_STATE
  )
  const [offlineState, setOfflineState] = useState(INITIAL_STATE)
  const effectState = offlineState.success || offlineState.error ? offlineState : state

  useEffect(() => {
    if (effectState.success) {
      toast.success(offlineState.success ? "Transaction saved offline" : "Transaction recorded")
      setOfflineState(INITIAL_STATE); onClose()
    }
    if (effectState.error) toast.error(effectState.error)
  }, [effectState, onClose])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isOffline()) {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const accountId = fd.get("account_id") as string
      const type = fd.get("type") as string
      const amount = Math.round(Number(fd.get("amount")) * 100)
      const description = fd.get("description") as string
      if (!accountId || !type || !amount || !description?.trim()) {
        setOfflineState({ error: "Account, type, amount, and description are required." }); return
      }
      offlineRecordBankingTransaction(db, saccoId, {
        account_id: accountId,
        type: type as "deposit" | "withdrawal",
        amount,
        description,
        reference: fd.get("reference") as string || null,
        notes: fd.get("notes") as string || null,
        receipt_url: null,
      })
        .then(() => setOfflineState({ success: true }))
        .catch(() => setOfflineState({ error: "Failed to save offline." }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-blue-500" />
            Record Transaction
          </DialogTitle>
          <DialogDescription>Record a bank deposit or withdrawal</DialogDescription>
        </DialogHeader>

        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Account *</Label>
            <Select name="account_id" defaultValue="">
              <SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger>
              <SelectContent>
                {bankAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.bankName} — {a.accountName} ({a.accountNumber})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select name="type" defaultValue="deposit">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (UGX) *</Label>
              <Input name="amount" type="number" step="0.01" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Input name="description" placeholder="e.g. Member deposit collection" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Reference</Label>
              <Input name="reference" placeholder="Receipt no." />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <textarea name="notes" rows={2}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              placeholder="Optional notes"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { usePowerSync } from "@powersync/react"
import { offlineAddBankAccount, offlineUpdateBankAccount } from "@/lib/powersync/offline-mutations"
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
import { Switch } from "@/components/ui/switch"
import { Loader2, Building2 } from "lucide-react"

type DialogState = { success?: boolean; error?: string }
const INITIAL_STATE: DialogState = {}

export function AddAccountDialog({
  open, onClose, account, saccoId,
}: {
  open: boolean; onClose: () => void; account?: any; saccoId: string
}) {
  const db = usePowerSync()
  const [isActiveChecked, setIsActiveChecked] = useState(account?.isActive ?? true)
  const [state, formAction, isPending] = useActionState(
    async (prev: any, fd: FormData) => {
      if (isOffline()) return { success: true }
      const { addBankAccountAction, updateBankAccountAction } = await import("../actions")
      return account ? updateBankAccountAction(prev, fd) : addBankAccountAction(prev, fd)
    }, INITIAL_STATE
  )
  const [offlineState, setOfflineState] = useState(INITIAL_STATE)
  const effectState = offlineState.success || offlineState.error ? offlineState : state

  useEffect(() => {
    if (effectState.success) {
      toast.success(offlineState.success ? "Bank account saved offline" : account ? "Bank account updated" : "Bank account added")
      setOfflineState(INITIAL_STATE); onClose()
    }
    if (effectState.error) toast.error(effectState.error)
  }, [effectState, onClose, account])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isOffline()) {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const bankName = fd.get("bank_name") as string
      const accountName = fd.get("account_name") as string
      const accountNumber = fd.get("account_number") as string
      if (!bankName?.trim() || !accountName?.trim() || !accountNumber?.trim()) {
        setOfflineState({ error: "Bank name, account name, and account number are required." }); return
      }
      const data = {
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
        branch: fd.get("branch") as string || null,
        is_active: isActiveChecked ? 1 : 0,
      }
      if (account) {
        offlineUpdateBankAccount(db, account.id, data)
          .then(() => setOfflineState({ success: true }))
          .catch(() => setOfflineState({ error: "Failed to save offline." }))
      } else {
        offlineAddBankAccount(db, saccoId, data)
          .then(() => setOfflineState({ success: true }))
          .catch(() => setOfflineState({ error: "Failed to save offline." }))
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            {account ? "Edit Bank Account" : "Add Bank Account"}
          </DialogTitle>
          <DialogDescription>Register a SACCO bank account for tracking deposits and withdrawals</DialogDescription>
        </DialogHeader>

        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
          {account && <input type="hidden" name="id" value={account.id} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Bank Name *</Label>
              <Input name="bank_name" defaultValue={account?.bankName ?? ""} placeholder="e.g. Stanbic" />
            </div>
            <div className="space-y-1.5">
              <Label>Account Name *</Label>
              <Input name="account_name" defaultValue={account?.accountName ?? ""} placeholder="e.g. SACCO Main A/c" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Account Number *</Label>
              <Input name="account_number" defaultValue={account?.accountNumber ?? ""} placeholder="e.g. 9030001234567" />
            </div>
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Input name="branch" defaultValue={account?.branch ?? ""} placeholder="e.g. Kampala Main" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="hidden" name="is_active" value={isActiveChecked ? "on" : "off"} />
            <Switch checked={isActiveChecked} onCheckedChange={setIsActiveChecked} />
            <Label className="text-sm">Active account</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {account ? "Update" : "Add Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

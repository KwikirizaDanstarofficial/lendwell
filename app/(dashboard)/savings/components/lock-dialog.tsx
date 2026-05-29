"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { lockAccountAction } from "../actions"
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
import { Loader2, Lock } from "lucide-react"

export function LockDialog({
  account,
  open,
  onClose,
}: {
  account: any
  open: boolean
  onClose: () => void
}) {
  const [state, formAction, isPending] = useActionState(lockAccountAction, {} as { success?: boolean; error?: string })

  useEffect(() => {
    if (state.success) {
      toast.success("Account locked successfully!")
      onClose()
    }
    if (state.error) toast.error(state.error)
  }, [state, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600" />
            Lock Savings Account
          </DialogTitle>
          <DialogDescription>
            {account.accountNumber} · {account.member_name} · Balance:{" "}
            <span className="font-semibold text-foreground">
              {formatUGX(account.balance)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="account_id" value={account.id} />

          <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg text-sm text-orange-700 dark:text-orange-400">
            Locking this account will prevent any withdrawals until the lock expires.
          </div>

          <div className="space-y-1.5">
            <Label>Lock Until *</Label>
            <Input
              name="lock_until"
              type="date"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Input
              name="lock_reason"
              placeholder="e.g. Fixed deposit term, collateral"
            />
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
              Lock Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { usePowerSync } from "@powersync/react"
import { lockAccountAction } from "../actions"
import { offlineLockAccount } from "@/lib/powersync/offline-mutations"
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
import { isOffline } from "@/lib/utils/is-offline"

export function LockDialog({
  account,
  open,
  onClose,
}: {
  account: any
  open: boolean
  onClose: () => void
}) {
  const db = usePowerSync()
  const [offlineSuccess, setOfflineSuccess] = useState(false)
  const [state, formAction, isPending] = useActionState(lockAccountAction, {} as { success?: boolean; error?: string; offline?: boolean })
  const lastSubmitRef = useRef<{ lock_until?: string; lock_reason?: string } | null>(null)

  useEffect(() => {
    if (offlineSuccess) { onClose(); return }
    if (state.success) {
      toast.success("Account locked successfully!")
      onClose()
    }
    if (state.offline) {
      const { lock_until, lock_reason } = lastSubmitRef.current ?? {}
      offlineLockAccount(db, account.id, lock_until ?? null, lock_reason ?? null)
        .then(() => { toast.success("Account locked offline — will sync when connected."); setOfflineSuccess(true) })
        .catch(() => toast.error("Failed to save offline."))
      return
    }
    if (state.error) toast.error(state.error)
  }, [state, onClose, offlineSuccess, db, account])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget)
    const lock_until = fd.get("lock_until") as string
    const lock_reason = fd.get("lock_reason") as string
    lastSubmitRef.current = { lock_until, lock_reason }
    if (isOffline()) {
      e.preventDefault()
      if (!lock_until) { toast.error("Please set a lock expiry date."); return }
      offlineLockAccount(db, account.id, lock_until, lock_reason || null)
        .then(() => { toast.success("Account locked offline — will sync when connected."); setOfflineSuccess(true) })
        .catch(() => toast.error("Failed to save offline."))
    }
  }

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

        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
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
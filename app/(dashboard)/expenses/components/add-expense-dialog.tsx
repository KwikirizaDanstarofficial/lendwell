"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { usePowerSync } from "@powersync/react"
import { offlineAddExpense, offlineUpdateExpense } from "@/lib/powersync/offline-mutations"
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
import { Loader2, Receipt } from "lucide-react"

const CATEGORIES = [
  "utilities", "rent", "salaries", "supplies", "maintenance",
  "transportation", "communication", "marketing", "insurance", "taxes",
  "legal", "training", "equipment", "software", "other",
] as const

const PAYMENT_METHODS = ["cash", "mobile_money", "bank", "flutterwave", "mtn", "airtel"] as const

const CATEGORY_LABELS: Record<string, string> = {
  utilities: "Utilities", rent: "Rent", salaries: "Salaries", supplies: "Supplies",
  maintenance: "Maintenance", transportation: "Transportation", communication: "Communication",
  marketing: "Marketing", insurance: "Insurance", taxes: "Taxes", legal: "Legal",
  training: "Training", equipment: "Equipment", software: "Software", other: "Other",
}

type DialogState = { success?: boolean; error?: string }
const INITIAL_STATE: DialogState = {}

export function AddExpenseDialog({
  open, onClose, expense, saccoId,
}: {
  open: boolean; onClose: () => void; expense?: any; saccoId: string
}) {
  const db = usePowerSync()
  const [state, formAction, isPending] = useActionState(
    async (prev: any, fd: FormData) => {
      if (isOffline()) return { success: true }
      const { addExpenseAction, updateExpenseAction } = await import("../actions")
      return expense ? updateExpenseAction(prev, fd) : addExpenseAction(prev, fd)
    }, INITIAL_STATE
  )
  const [offlineState, setOfflineState] = useState(INITIAL_STATE)
  const effectState = offlineState.success || offlineState.error ? offlineState : state

  useEffect(() => {
    if (effectState.success) {
      toast.success(offlineState.success ? "Expense saved offline" : expense ? "Expense updated" : "Expense added")
      setOfflineState(INITIAL_STATE); onClose()
    }
    if (effectState.error) toast.error(effectState.error)
  }, [effectState, onClose, expense])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isOffline()) {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const category = fd.get("category") as string
      const amount = Math.round(Number(fd.get("amount")) * 100)
      const description = fd.get("description") as string
      if (!category || !amount || !description?.trim()) {
        setOfflineState({ error: "Category, amount, and description are required." }); return
      }
      const data = {
        category, amount, description,
        payment_method: fd.get("payment_method") as string || "cash",
        reference: fd.get("reference") as string || null,
        paid_by: fd.get("paid_by") as string || null,
        paid_at: fd.get("paid_at") as string || null,
        notes: fd.get("notes") as string || null,
      }
      if (expense) {
        offlineUpdateExpense(db, expense.id, data)
          .then(() => setOfflineState({ success: true }))
          .catch(() => setOfflineState({ error: "Failed to save offline." }))
      } else {
        offlineAddExpense(db, saccoId, data)
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
            <Receipt className="h-5 w-5 text-orange-500" />
            {expense ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
          <DialogDescription>Record a SACCO operational expense</DialogDescription>
        </DialogHeader>

        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
          {expense && <input type="hidden" name="id" value={expense.id} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select name="category" defaultValue={expense?.category ?? ""}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (UGX) *</Label>
              <Input name="amount" type="number" step="0.01" defaultValue={expense ? expense.amount / 100 : ""} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Input name="description" defaultValue={expense?.description ?? ""} placeholder="What was this for?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select name="payment_method" defaultValue={expense?.paymentMethod ?? "cash"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reference</Label>
              <Input name="reference" defaultValue={expense?.reference ?? ""} placeholder="Invoice no." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Paid Date</Label>
              <Input name="paid_at" type="date" defaultValue={expense?.paidAt ? new Date(expense.paidAt).toISOString().split("T")[0] : ""} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <textarea name="notes" rows={2} defaultValue={expense?.notes ?? ""}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              placeholder="Optional notes"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-orange-600 text-white hover:bg-orange-700">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {expense ? "Update" : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

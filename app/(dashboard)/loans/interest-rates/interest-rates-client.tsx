"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { toast } from "sonner"
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
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
  WifiOff,
} from "lucide-react"
import { useQuery, usePowerSync } from "@powersync/react"
import { isOffline } from "@/lib/utils/is-offline"
import {
  addInterestRateAction,
  updateInterestRateAction,
  deleteInterestRateAction,
  getInterestRatesAction,
} from "../components/interest-rate-actions"

// ─── Types ────────────────────────────────────────────────────────────────────

interface RateRow {
  id: string
  minAmount: number
  maxAmount: number
  rate: string
  rateType: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InterestRatesClient({ saccoId }: { saccoId: string }) {
  const db = usePowerSync()
  const offline = isOffline()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RateRow | null>(null)

  // Server-fetched rates used as fallback when local DB is empty
  const [serverRates, setServerRates] = useState<RateRow[]>([])

  const [formData, setFormData] = useState({
    min_amount: "",
    max_amount: "",
    rate: "",
    rate_type: "monthly" as "daily" | "monthly" | "annual",
  })

  // ─── Data ─────────────────────────────────────────────────────────────────

  // Primary source: PowerSync local SQLite (reactive)
  const { data: localRows = [], isLoading } = useQuery(
    `SELECT id, min_amount as minAmount, max_amount as maxAmount,
            rate, rate_type as rateType
     FROM interest_rates
     WHERE sacco_id = ? AND is_active = 1
     ORDER BY min_amount ASC`,
    [saccoId]
  )

  const localRates: RateRow[] = (localRows as any[]).map((r) => ({
    id:        r.id,
    minAmount: Number(r.minAmount),
    maxAmount: Number(r.maxAmount),
    rate:      r.rate,
    rateType:  r.rateType,
  }))

  // Merge local (authoritative) and server rates, deduplicating by ID.
  // Local takes precedence so optimistic offline writes show immediately.
  const rates: RateRow[] = useMemo(() => {
    const map = new Map<string, RateRow>()
    for (const r of serverRates) map.set(r.id, r)
    for (const r of localRates)  map.set(r.id, r)
    return Array.from(map.values()).sort((a, b) => a.minAmount - b.minAmount)
  }, [localRates, serverRates])

  // Refresh server rates — called after successful online mutations
  const refreshFromServer = useCallback(() => {
    getInterestRatesAction()
      .then((data: any[]) => setServerRates(
        data.map((r) => ({
          id:        r.id,
          minAmount: Number(r.minAmount),
          maxAmount: Number(r.maxAmount),
          rate:      r.rate,
          rateType:  r.rateType,
        }))
      ))
      .catch(() => {})
  }, [])

  // On mount (when local DB empty and online), pull from server to show data
  useEffect(() => {
    if (localRates.length === 0 && !offline) {
      refreshFromServer()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localRates.length, offline])

  // ─── Validation helpers ───────────────────────────────────────────────────

  const validateForm = () => {
    const minAmount = parseFloat(formData.min_amount)
    const maxAmount = parseFloat(formData.max_amount)
    const rate      = parseFloat(formData.rate)
    if (!formData.min_amount || !formData.max_amount || !formData.rate) {
      toast.error("Please fill all fields"); return null
    }
    if (isNaN(minAmount) || isNaN(maxAmount) || isNaN(rate)) {
      toast.error("Please enter valid numbers"); return null
    }
    if (minAmount >= maxAmount) {
      toast.error("Minimum amount must be less than maximum amount"); return null
    }
    if (rate <= 0 || rate > 100) {
      toast.error("Interest rate must be between 0 and 100"); return null
    }
    return { minAmount, maxAmount, rate }
  }

  const hasOverlap = (minAmount: number, maxAmount: number, excludeId?: string) =>
    rates.some((r) => r.id !== excludeId && minAmount < r.maxAmount && maxAmount > r.minAmount)

  // ─── Local SQLite writes (offline / server-fail fallback) ─────────────────

  const writeLocalAdd = async (minAmount: number, maxAmount: number, rate: number) => {
    const id = crypto.randomUUID()
    const ts = new Date().toISOString()
    await db.execute(
      `INSERT INTO interest_rates
         (id, sacco_id, min_amount, max_amount, rate, rate_type, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [id, saccoId, minAmount, maxAmount, String(rate), formData.rate_type, ts, ts]
    )
  }

  const writeLocalUpdate = async (id: string, minAmount: number, maxAmount: number, rate: number) => {
    await db.execute(
      `UPDATE interest_rates
       SET min_amount = ?, max_amount = ?, rate = ?, rate_type = ?, updated_at = ?
       WHERE id = ?`,
      [minAmount, maxAmount, String(rate), formData.rate_type, new Date().toISOString(), id]
    )
  }

  // Soft-delete: keeps the row in local DB until PowerSync syncs the DELETE to Supabase
  const writeLocalDelete = async (id: string) => {
    await db.execute(
      "UPDATE interest_rates SET is_active = 0, updated_at = ? WHERE id = ?",
      [new Date().toISOString(), id]
    )
    // Remove from server rates display immediately
    setServerRates((prev) => prev.filter((r) => r.id !== id))
  }

  // ─── Handlers ────────────────────────────────────────────────────────────

  const resetForm = () => setFormData({ min_amount: "", max_amount: "", rate: "", rate_type: "monthly" })

  const handleAdd = async () => {
    const vals = validateForm()
    if (!vals) return
    const { minAmount, maxAmount, rate } = vals

    if (hasOverlap(minAmount, maxAmount)) {
      toast.error("This amount range overlaps with an existing range"); return
    }

    setLoading(true)
    try {
      if (offline) {
        await writeLocalAdd(minAmount, maxAmount, rate)
        toast.success("Interest rate added (offline — will sync when connected)")
      } else {
        const result = await addInterestRateAction({ minAmount, maxAmount, rate, rateType: formData.rate_type })
        if (result.error) {
          await writeLocalAdd(minAmount, maxAmount, rate)
          toast.success("Interest rate added offline (sync pending)")
        } else {
          refreshFromServer()
          toast.success("Interest rate added successfully")
        }
      }
      setIsAdding(false)
      resetForm()
    } catch {
      toast.error("Failed to add interest rate")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string) => {
    const vals = validateForm()
    if (!vals) return
    const { minAmount, maxAmount, rate } = vals

    if (hasOverlap(minAmount, maxAmount, id)) {
      toast.error("This amount range overlaps with an existing range"); return
    }

    setLoading(true)
    try {
      if (offline) {
        await writeLocalUpdate(id, minAmount, maxAmount, rate)
        toast.success("Interest rate updated (offline — will sync when connected)")
      } else {
        const result = await updateInterestRateAction(id, { minAmount, maxAmount, rate, rateType: formData.rate_type })
        if (result.error) {
          await writeLocalUpdate(id, minAmount, maxAmount, rate)
          toast.success("Interest rate updated offline (sync pending)")
        } else {
          await writeLocalUpdate(id, minAmount, maxAmount, rate)  // optimistic local update
          refreshFromServer()
          toast.success("Interest rate updated successfully")
        }
      }
      setEditingId(null)
      resetForm()
    } catch {
      toast.error("Failed to update interest rate")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setLoading(true)
    try {
      if (offline) {
        await writeLocalDelete(deleteTarget.id)
        toast.success("Interest rate deleted (offline — will sync when connected)")
      } else {
        const result = await deleteInterestRateAction(deleteTarget.id)
        if (result.error) {
          await writeLocalDelete(deleteTarget.id)
          toast.success("Interest rate deleted offline (sync pending)")
        } else {
          await writeLocalDelete(deleteTarget.id)
          toast.success("Interest rate deleted successfully")
        }
      }
    } catch {
      toast.error("Failed to delete interest rate")
    } finally {
      setLoading(false)
      setDeleteTarget(null)
    }
  }

  const startEdit = (rate: RateRow) => {
    setEditingId(rate.id)
    setFormData({
      min_amount: rate.minAmount.toString(),
      max_amount: rate.maxAmount.toString(),
      rate:       rate.rate,
      rate_type:  rate.rateType as any,
    })
  }

  const cancelEdit = () => { setEditingId(null); resetForm() }
  const cancelAdd  = () => { setIsAdding(false); resetForm() }
  const fmt = (ugx: number) => `UGX ${ugx.toLocaleString()}`

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interest Rate?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the rate for{" "}
              {deleteTarget ? `${fmt(deleteTarget.minAmount)} – ${fmt(deleteTarget.maxAmount)}` : ""}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/loans">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <TrendingUp className="h-6 w-6 text-green-600" />
              Interest Rate Configuration
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Define interest rates based on loan amount ranges
            </p>
          </div>
        </div>
        {offline && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <WifiOff className="h-3.5 w-3.5" />
            Offline — changes saved locally
          </div>
        )}
      </div>

      {/* Info card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                How Interest Rates Work
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                When a member applies for a loan, the system checks the loan amount
                against these ranges and applies the corresponding interest rate.
                Ranges must not overlap and should cover all loan amounts your SACCO offers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add button */}
      {!isAdding && (
        <Button onClick={() => setIsAdding(true)} className="w-full sm:w-auto" disabled={loading}>
          <Plus className="mr-2 h-4 w-4" />
          Add Interest Rate Range
        </Button>
      )}

      {/* Add form */}
      {isAdding && (
        <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/10">
          <CardContent className="pt-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Plus className="h-4 w-4 text-green-600" />
              Add New Interest Rate Range
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="text-sm font-medium">Min Amount (UGX)</Label>
                <Input
                  type="number" placeholder="e.g., 20,000"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">Minimum loan amount</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Max Amount (UGX)</Label>
                <Input
                  type="number" placeholder="e.g., 500,000"
                  value={formData.max_amount}
                  onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">Maximum loan amount</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Interest Rate (%)</Label>
                <Input
                  type="number" step="0.1" placeholder="e.g., 10"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">Percentage per period</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Rate Type</Label>
                <Select
                  value={formData.rate_type}
                  onValueChange={(v: any) => setFormData({ ...formData, rate_type: v })}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Interest</SelectItem>
                    <SelectItem value="monthly">Monthly Interest</SelectItem>
                    <SelectItem value="annual">Annual Interest</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">How interest is calculated</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={cancelAdd} disabled={loading}>Cancel</Button>
              <Button onClick={handleAdd} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Rate Range
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rates table */}
      {rates.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[30%]">Amount Range</TableHead>
                <TableHead className="w-[25%]">Interest Rate</TableHead>
                <TableHead className="w-[25%]">Rate Type</TableHead>
                <TableHead className="w-[20%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => (
                <TableRow key={rate.id} className="group">
                  {editingId === rate.id ? (
                    <>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number" placeholder="Min"
                            value={formData.min_amount}
                            onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                            className="w-28"
                          />
                          <span className="text-muted-foreground">–</span>
                          <Input
                            type="number" placeholder="Max"
                            value={formData.max_amount}
                            onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                            className="w-28"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number" step="0.1"
                          value={formData.rate}
                          onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={formData.rate_type}
                          onValueChange={(v: any) => setFormData({ ...formData, rate_type: v })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleUpdate(rate.id)} disabled={loading} className="h-8 w-8 p-0">
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">
                        {fmt(rate.minAmount)} – {fmt(rate.maxAmount)}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">{rate.rate}%</span>
                      </TableCell>
                      <TableCell className="capitalize">{rate.rateType}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(rate)} className="h-8 w-8 p-0">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => setDeleteTarget(rate)}
                            disabled={loading}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border py-12 text-center text-muted-foreground">
          <TrendingUp className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">No interest rates configured</p>
          <p className="mt-1 text-sm">
            {offline
              ? "No rates in local cache — connect to sync from the server."
              : "Click \"Add Interest Rate Range\" to set up your first rate tier."}
          </p>
        </div>
      )}

      {/* Summary */}
      {rates.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Coverage Summary</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {rates.length} rate tier{rates.length !== 1 ? "s" : ""} configured
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Range Coverage</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {fmt(rates[0]?.minAmount ?? 0)} to {fmt(rates[rates.length - 1]?.maxAmount ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

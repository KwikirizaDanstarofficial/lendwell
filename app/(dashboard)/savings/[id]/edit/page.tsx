// app/(dashboard)/savings/[id]/edit/page.tsx
"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSavingsById, updateSavingsAction } from "../../actions"

interface SavingsAccount {
  id: string
  sacco_id: string
  member_id: string
  category_id: string | null
  account_number: string
  balance: number
  account_type: string
  is_locked: boolean
  lock_until: string | null
  lock_reason: string | null
  created_at: Date | null
  updated_at: Date | null
  member_name: string | null
  member_code: string | null
  member_phone: string | null
}

export default function EditSavingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savings, setSavings] = useState<SavingsAccount | null>(null)
  const [accountType, setAccountType] = useState("regular")
  const [isLocked, setIsLocked] = useState(false)
  const [lockUntil, setLockUntil] = useState("")
  const [lockReason, setLockReason] = useState("")

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      const savingsData = await getSavingsById(id)
      if (savingsData) {
        setSavings(savingsData as SavingsAccount)
        setAccountType((savingsData as SavingsAccount).account_type)
        setIsLocked((savingsData as SavingsAccount).is_locked)
        setLockUntil((savingsData as SavingsAccount).lock_until || "")
        setLockReason((savingsData as SavingsAccount).lock_reason || "")
      }
    } catch (error) {
      console.error("Failed to load savings:", error)
      toast.error("Failed to load savings data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append("savings_id", id)
      formData.append("account_type", accountType)
      formData.append("is_locked", isLocked.toString())
      formData.append("lock_until", lockUntil)
      formData.append("lock_reason", lockReason)

      const result = await updateSavingsAction(id, {
        account_type: accountType as "regular" | "fixed",
      })
      if (result.success) {
        toast.success("Savings account updated successfully")
        router.push(`/savings/${id}`)
      } else {
        toast.error(result.error || "Failed to update savings account")
      }
    } catch (error) {
      toast.error("Failed to update savings account")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!savings) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <p className="text-muted-foreground">Savings account not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/savings")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Savings
        </Button>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/savings/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Edit Savings Account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {savings.account_number} · {savings.member_name || "Unknown"}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-type">Account Type</Label>
                <Select
                  value={accountType}
                  onValueChange={(value) => setAccountType(value || "regular")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular Savings</SelectItem>
                    <SelectItem value="fixed">Fixed Deposit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is-locked">Account Status</Label>
                <Select
                  value={isLocked.toString()}
                  onValueChange={(value) => setIsLocked(value === "true")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Active</SelectItem>
                    <SelectItem value="true">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLocked && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="lock-until">Lock Until</Label>
                    <Input
                      id="lock-until"
                      type="date"
                      value={lockUntil}
                      onChange={(e) => setLockUntil(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lock-reason">Lock Reason</Label>
                    <Input
                      id="lock-reason"
                      placeholder="Enter reason for locking"
                      value={lockReason}
                      onChange={(e) => setLockReason(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/savings/${id}`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

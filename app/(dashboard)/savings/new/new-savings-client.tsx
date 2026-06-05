"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  PiggyBank,
  Lock,
  Wallet,
  Calculator,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useQuery, usePowerSync } from "@powersync/react"
import { createSavingsAccountAction } from "../actions"
import { isOffline } from "@/lib/utils/is-offline"

interface Member {
  id: string
  full_name: string
  member_code: string
  phone: string | null
  status: string
}

interface SavingsCategory {
  id: string
  name: string
  description: string | null
  interest_rate: string | null
  is_fixed: boolean | null
  is_active: boolean | null
}

export function NewSavingsClient({
  saccoId,
  initialMembers = [],
  initialCategories = [],
}: {
  saccoId: string
  initialMembers?: Member[]
  initialCategories?: SavingsCategory[]
}) {
  const router = useRouter()
  const db = usePowerSync()
  const [saving, setSaving] = useState(false)

  const { data: unsortedMembers = [], isLoading: loading } = useQuery(
    `SELECT id, full_name, member_code, phone, status FROM members WHERE sacco_id = ? ORDER BY full_name ASC`,
    [saccoId]
  )
  const localMembers = unsortedMembers as unknown as Member[]
  const members: Member[] = localMembers.length > 0 ? localMembers : initialMembers

  const { data: rawCategories = [] } = useQuery(
    `SELECT id, name, description, interest_rate, is_fixed, is_active FROM savings_categories WHERE sacco_id = ?`,
    [saccoId]
  )
  const localCategories = rawCategories as unknown as SavingsCategory[]
  const categories: SavingsCategory[] = localCategories.length > 0 ? localCategories : initialCategories

  const [selectedMember, setSelectedMember] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [accountType, setAccountType] = useState("regular")
  const [initialDeposit, setInitialDeposit] = useState("")
  const [interestRate, setInterestRate] = useState("")
  const [lockDuration, setLockDuration] = useState("")
  const [lockReason, setLockReason] = useState("")
  const [confirmed, setConfirmed] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [memberFilter, setMemberFilter] = useState("all")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const offline = isOffline()

  const filteredMembers = useMemo(() => {
    let filtered = [...members]
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (member) =>
          member.full_name.toLowerCase().includes(searchLower) ||
          member.member_code.toLowerCase().includes(searchLower) ||
          (member.phone && member.phone.toLowerCase().includes(searchLower))
      )
    }
    if (memberFilter !== "all") {
      filtered = filtered.filter((member) => member.status === memberFilter)
    }
    return filtered
  }, [members, searchQuery, memberFilter])

  const selectedMemberDetails = members.find((m) => m.id === selectedMember)
  const selectedCategoryDetails = categories.find(
    (c) => c.id === selectedCategory
  )

  const calculateEarnings = () => {
    const deposit = Number(initialDeposit) || 0
    const rate = Number(interestRate) || 0
    const years =
      accountType === "fixed" ? (Number(lockDuration) || 12) / 12 : 1
    if (deposit === 0 || rate === 0) return null
    const yearlyInterest = deposit * (rate / 100)
    const totalInterest = yearlyInterest * years
    const totalAmount = deposit + totalInterest
    return { deposit, rate, years, yearlyInterest, totalInterest, totalAmount }
  }

  const earnings = calculateEarnings()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMember) {
      toast.error("Please select a member")
      return
    }

    setSaving(true)
    try {
      if (offline) {
        const id = crypto.randomUUID()
        const ts = new Date().toISOString()
        const deposit = (parseFloat(initialDeposit) || 0) * 100
        const isLocked = accountType === "fixed"
        const lockUntil = lockDuration
          ? new Date(Date.now() + parseInt(lockDuration) * 30 * 24 * 60 * 60 * 1000).toISOString()
          : null
        const member = members.find((m) => m.id === selectedMember)

        await db.execute(
          `INSERT INTO savings_accounts
             (id, sacco_id, member_id, category_id, account_number, account_type,
              balance, is_locked, lock_until, lock_reason, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, saccoId, selectedMember, selectedCategory || null,
            `SAV-${Date.now()}`, accountType, deposit,
            isLocked ? 1 : 0, lockUntil, lockReason || null,
            ts, ts,
          ]
        )
        if (deposit > 0) {
          await db.execute(
            `INSERT INTO transactions
               (id, sacco_id, member_id, type, amount, balance_after,
                reference_id, narration, created_at)
             VALUES (?, ?, ?, 'savings_deposit', ?, ?, ?, 'Initial deposit', ?)`,
            [crypto.randomUUID(), saccoId, selectedMember, deposit, deposit, id, ts]
          )
        }
        toast.success(`Savings account created (offline) for ${member?.full_name || "member"}`)
        router.push("/savings")
        return
      }

      const formData = new FormData()
      formData.append("member_id", selectedMember)
      formData.append("category_id", selectedCategory)
      formData.append("account_type", accountType)
      formData.append("initial_deposit", initialDeposit || "0")
      formData.append("interest_rate", interestRate)
      formData.append("is_locked", accountType === "fixed" ? "true" : "false")
      if (lockDuration) formData.append("lock_until", lockDuration)
      if (lockReason) formData.append("lock_reason", lockReason)

      const result = await createSavingsAccountAction(
        { success: false },
        formData
      )
      if (result.success) {
        toast.success("Savings account created successfully")
        router.push("/savings")
        router.refresh()
      } else if (result.offline) {
        // Server couldn't reach Supabase — save to local SQLite instead
        const deposit = (parseFloat(initialDeposit) || 0) * 100
        const isLocked = accountType === "fixed"
        const lockUntil = lockDuration
          ? new Date(Date.now() + parseInt(lockDuration) * 30 * 24 * 60 * 60 * 1000).toISOString()
          : null
        const ts = new Date().toISOString()
        const id = crypto.randomUUID()
        await db.execute(
          `INSERT INTO savings_accounts
             (id, sacco_id, member_id, category_id, account_number, account_type,
              balance, is_locked, lock_until, lock_reason, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, saccoId, selectedMember, selectedCategory || null,
           `SAV-${Date.now()}`, accountType, deposit,
           isLocked ? 1 : 0, lockUntil, lockReason || null, ts, ts]
        )
        if (deposit > 0) {
          await db.execute(
            `INSERT INTO transactions
               (id, sacco_id, member_id, type, amount, balance_after, reference_id, narration, created_at)
             VALUES (?, ?, ?, 'savings_deposit', ?, ?, ?, 'Initial deposit', ?)`,
            [crypto.randomUUID(), saccoId, selectedMember, deposit, deposit, id, ts]
          )
        }
        toast.success("Savings account saved offline — will sync when reconnected")
        router.push("/savings")
      } else {
        toast.error(result.error || "Failed to create savings account")
      }
    } catch (error) {
      toast.error("Failed to create savings account")
    } finally {
      setSaving(false)
    }
  }

  const isFormValid =
    selectedMember &&
    (accountType === "fixed"
      ? Number(initialDeposit) > 0 && lockDuration
      : Number(initialDeposit) > 0) &&
    confirmed

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/savings")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Create New Savings Account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a new savings account for a member
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Member
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1"></div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Select
                  value={memberFilter}
                  onValueChange={(value) => setMemberFilter(value || "all")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="exited">Exited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Member *</Label>
              <Select
                value={selectedMember}
                onValueChange={(value) => {
                  setSelectedMember(value || "")
                  setSearchQuery("")
                }}
                open={isSearchOpen}
                onOpenChange={setIsSearchOpen}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Choose a member">
                    {selectedMemberDetails && (
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          {selectedMemberDetails.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {selectedMemberDetails.member_code}
                          {selectedMemberDetails.phone &&
                            ` · ${selectedMemberDetails.phone}`}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="p-0">
                  <div className="flex items-center border-b px-3 pt-2 pb-2">
                    <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, code, or phone..."
                      className="h-8 border-0 p-0 shadow-none focus-visible:ring-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredMembers.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No member found.
                      </div>
                    ) : (
                      filteredMembers.map((member) => (
                        <SelectItem
                          key={member.id}
                          value={member.id}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {member.full_name}
                              </span>
                              <Badge
                                variant={
                                  member.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {member.status}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {member.member_code}
                              {member.phone && ` · ${member.phone}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-type">Account Type *</Label>
                <Select
                  value={accountType}
                  onValueChange={(value) => {
                    setAccountType(value || "regular")
                    if (value === "fixed") {
                      setConfirmed(false)
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Regular Savings
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Fixed Deposit
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {accountType === "fixed"
                    ? "Fixed deposits earn higher interest but cannot be withdrawn until maturity"
                    : "Regular savings accounts allow flexible deposits and withdrawals"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value || "")
                    const category = categories.find((c) => c.id === value)
                    if (category?.interest_rate) {
                      setInterestRate(category.interest_rate)
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories
                      .filter((c) => c.is_active !== false)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex flex-col">
                            <span>{category.name}</span>
                            {category.description && (
                              <span className="text-xs text-muted-foreground">
                                {category.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial-deposit">Initial Deposit (UGX) *</Label>
                <Input
                  id="initial-deposit"
                  type="number"
                  placeholder="Enter initial deposit amount"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                />
                {Number(initialDeposit) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Minimum deposit: UGX 10,000
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                <Input
                  id="interest-rate"
                  type="number"
                  step="0.01"
                  placeholder="Enter interest rate"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
                {selectedCategoryDetails?.interest_rate && (
                  <p className="text-xs text-muted-foreground">
                    Category default: {selectedCategoryDetails.interest_rate}%
                  </p>
                )}
              </div>

              {accountType === "fixed" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="lock-duration">
                      Lock Duration (months)
                    </Label>
                    <Select
                      value={lockDuration}
                      onValueChange={(value) => setLockDuration(value || "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select lock period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 months</SelectItem>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="24">24 months</SelectItem>
                        <SelectItem value="36">36 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lock-reason">Lock Reason (Optional)</Label>
                    <Input
                      id="lock-reason"
                      placeholder="e.g., Promotional offer, Member request"
                      value={lockReason}
                      onChange={(e) => setLockReason(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {earnings && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4 text-green-600" />
                Interest Calculation Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Initial Deposit
                  </p>
                  <p className="text-lg font-semibold">
                    UGX {earnings.deposit.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Interest Rate</p>
                  <p className="text-lg font-semibold text-green-600">
                    {earnings.rate}% p.a.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Interest
                  </p>
                  <p className="text-lg font-semibold text-blue-600">
                    UGX {Math.floor(earnings.totalInterest).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Maturity Amount
                  </p>
                  <p className="text-xl font-bold text-green-700">
                    UGX {Math.floor(earnings.totalAmount).toLocaleString()}
                  </p>
                </div>
              </div>
              {accountType === "fixed" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Lock period: {lockDuration || "0"} months. Early withdrawal
                  may incur penalties.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
              <input
                type="checkbox"
                id="confirm"
                className="mt-1 h-4 w-4 accent-primary"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <label
                htmlFor="confirm"
                className="cursor-pointer text-sm leading-relaxed text-muted-foreground"
              >
                I confirm that all the information provided is correct. I
                understand that
                {accountType === "fixed"
                  ? ` this is a fixed deposit account that will be locked for ${lockDuration || "the selected"} months, and early withdrawal may incur penalties.`
                  : " this is a regular savings account that allows flexible deposits and withdrawals."}
                The initial deposit of{" "}
                <span className="font-semibold text-foreground">
                  UGX {(Number(initialDeposit) || 0).toLocaleString()}
                </span>
                will be credited to the account upon creation.
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/savings")}
            disabled={saving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={saving || !isFormValid}
            className="min-w-[160px]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

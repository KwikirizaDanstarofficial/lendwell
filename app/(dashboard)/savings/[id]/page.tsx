// app/(dashboard)/savings/[id]/page.tsx
"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PiggyBank,
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Loader2,
  Plus,
  Minus,
  FileText,
} from "lucide-react"
import { formatUGX, formatDate } from "@/lib/utils/format"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  depositAction,
  withdrawAction,
  getSavingsById,
  getSavingsTransactions,
} from "../actions"

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

interface Transaction {
  id: string
  sacco_id: string
  member_id: string
  type: string
  amount: number
  balance_after: number | null
  reference_id: string | null
  payment_method: string | null
  narration: string | null
  created_at: Date | null
}

const typeColors: Record<string, string> = {
  regular: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  fixed:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
}

const transactionTypeColors: Record<string, string> = {
  savings_deposit:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  savings_withdrawal:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function SavingsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [savings, setSavings] = useState<SavingsAccount | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [depositDialogOpen, setDepositDialogOpen] = useState(false)
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [narration, setNarration] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      const [savingsData, transactionsData] = await Promise.all([
        getSavingsById(id),
        getSavingsTransactions(id),
      ])
      setSavings(savingsData as SavingsAccount)
      setTransactions(transactionsData as Transaction[])
    } catch (error) {
      console.error("Failed to load savings:", error)
      toast.error("Failed to load savings data")
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append("savings_id", id)
      formData.append("amount", amount)
      formData.append("narration", narration || "Savings deposit")

      const result = await depositAction({ success: false }, formData)
      if (result.success) {
        toast.success("Deposit successful")
        setDepositDialogOpen(false)
        setAmount("")
        setNarration("")
        loadData()
      } else {
        toast.error(result.error || "Failed to deposit")
      }
    } catch (error) {
      toast.error("Failed to deposit")
    } finally {
      setProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (savings && parseFloat(amount) * 100 > savings.balance) {
      toast.error("Insufficient balance")
      return
    }

    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append("savings_id", id)
      formData.append("amount", amount)
      formData.append("narration", narration || "Savings withdrawal")

      const result = await withdrawAction({ success: false }, formData)
      if (result.success) {
        toast.success("Withdrawal successful")
        setWithdrawDialogOpen(false)
        setAmount("")
        setNarration("")
        loadData()
      } else {
        toast.error(result.error || "Failed to withdraw")
      }
    } catch (error) {
      toast.error("Failed to withdraw")
    } finally {
      setProcessing(false)
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
            onClick={() => router.push("/savings")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Savings Account Details
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {savings.account_number} · {savings.member_name || "Unknown"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/savings/${id}/pdf`)}
            className="whitespace-nowrap"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWithdrawDialogOpen(true)}
            disabled={savings.is_locked}
            className="whitespace-nowrap"
          >
            <Minus className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
          <Button
            size="sm"
            onClick={() => setDepositDialogOpen(true)}
            disabled={savings.is_locked}
            className="whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" />
            Deposit
          </Button>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatUGX(savings.balance)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Account Type
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <Badge className={typeColors[savings.account_type]}>
              {savings.account_type}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Status
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <Badge
              className={
                savings.is_locked
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }
            >
              {savings.is_locked ? "Locked" : "Active"}
            </Badge>
            {savings.is_locked && savings.lock_reason && (
              <p className="mt-1 text-xs text-muted-foreground">
                {savings.lock_reason}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Member
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-medium">{savings.member_name || "Unknown"}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {savings.member_code || "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History (Timesheet) */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History (Timesheet)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Narration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {txn.created_at
                            ? formatDate(txn.created_at.toString())
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            transactionTypeColors[txn.type] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {txn.type === "savings_deposit" ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {txn.type.replace("savings_", "")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p
                          className={`font-semibold ${txn.type === "savings_deposit" ? "text-green-600" : "text-red-600"}`}
                        >
                          {txn.type === "savings_deposit" ? "+" : "-"}
                          {formatUGX(txn.amount)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {txn.balance_after
                            ? formatUGX(txn.balance_after)
                            : "N/A"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {txn.payment_method || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {txn.narration || "No description"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit to Savings</DialogTitle>
            <DialogDescription>
              Add funds to savings account {savings.account_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount (UGX)</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit-narration">Narration (Optional)</Label>
              <Input
                id="deposit-narration"
                placeholder="Enter description"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDepositDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleDeposit} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw from Savings</DialogTitle>
            <DialogDescription>
              Withdraw funds from savings account {savings.account_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (UGX)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available balance: {formatUGX(savings.balance)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdraw-narration">Narration (Optional)</Label>
              <Input
                id="withdraw-narration"
                placeholder="Enter description"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWithdrawDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Withdraw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

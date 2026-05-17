"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
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
  PiggyBank,
  Lock,
  Unlock,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
} from "lucide-react"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { getSavingsTransactionsAction } from "../actions"

export function AccountDetailDialog({
  account,
  open,
  onClose,
}: {
  account: any
  open: boolean
  onClose: () => void
}) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && account?.id) {
      setLoading(true)
      getSavingsTransactionsAction(account.id)
        .then((result) => {
          if (result.success && result.data) {
            setTransactions(result.data)
          }
        })
        .finally(() => setLoading(false))
    }
  }, [open, account?.id])

  const totalDeposits = transactions
    .filter((t) => t.type === "savings_deposit")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalWithdrawals = transactions
    .filter((t) => t.type === "savings_withdrawal")
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Account Timesheet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Account No</p>
                  <p className="font-mono font-medium">{account.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Member</p>
                  <p className="font-medium">{account.member_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="font-bold text-green-600">
                    {formatUGX(account.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <Badge variant="outline">{account.accountType}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={account.isLocked ? "destructive" : "default"}>
                    {account.isLocked ? (
                      <><Lock className="h-3 w-3 mr-1" />Locked</>
                    ) : (
                      <><Unlock className="h-3 w-3 mr-1" />Active</>
                    )}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Opened</p>
                  <p>{formatDate(account.createdAt)}</p>
                </div>
                {account.lockUntil && (
                  <div>
                    <p className="text-xs text-muted-foreground">Locked Until</p>
                    <p>{formatDate(account.lockUntil)}</p>
                  </div>
                )}
                {account.lockReason && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Lock Reason</p>
                    <p>{account.lockReason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Total Deposited</p>
                <p className="font-bold text-green-600 text-sm">
                  {formatUGX(totalDeposits)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <TrendingDown className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Total Withdrawn</p>
                <p className="font-bold text-orange-600 text-sm">
                  {formatUGX(totalWithdrawals)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <ArrowLeftRight className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="font-bold text-blue-600 text-sm">
                  {transactions.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Timesheet */}
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-semibold mb-3">Transaction History</p>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Loading...
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No transactions yet
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Balance After</TableHead>
                        <TableHead className="text-xs">Method</TableHead>
                        <TableHead className="text-xs">Narration</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <Badge
                              variant={
                                tx.type === "savings_deposit"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {tx.type === "savings_deposit"
                                ? "Deposit"
                                : "Withdrawal"}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-sm font-semibold ${
                              tx.type === "savings_deposit"
                                ? "text-green-600"
                                : "text-orange-600"
                            }`}
                          >
                            {tx.type === "savings_deposit" ? "+" : "-"}
                            {formatUGX(tx.amount)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {tx.balanceAfter != null
                              ? formatUGX(tx.balanceAfter)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {tx.paymentMethod ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {tx.narration ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatDate(tx.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
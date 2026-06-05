"use client"
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Minus,
  Lock,
  Unlock,
  PiggyBank,
  User,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { DepositDialog } from "../components/deposit-dialog"
import { WithdrawDialog } from "../components/withdraw-dialog"
import { LockDialog } from "../components/lock-dialog"
import { unlockAccountAction } from "../actions"
import { offlineUnlockAccount } from "@/lib/powersync/offline-mutations"
import { usePowerSync } from "@powersync/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { isOffline } from "@/lib/utils/is-offline"

// ── Inline helpers matching loan/member detail design ─────────────────────────

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType
  title: string
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <h2 className="text-sm font-semibold tracking-widest text-foreground uppercase">
        {title}
      </h2>
    </div>
  )
}

function InfoItem({
  label,
  value,
  accent,
}: {
  label: string
  value: React.ReactNode
  accent?: "green" | "orange" | "blue" | "red"
}) {
  const color =
    accent === "green"
      ? "text-green-600 dark:text-green-400"
      : accent === "orange"
        ? "text-orange-500 dark:text-orange-400"
        : accent === "blue"
          ? "text-blue-600 dark:text-blue-400"
          : accent === "red"
            ? "text-red-500 dark:text-red-400"
            : "text-foreground"
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
    </div>
  )
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: "green" | "blue" | "orange" | "purple"
}) {
  const ring =
    accent === "green"
      ? "border-green-200 dark:border-green-800"
      : accent === "blue"
        ? "border-blue-200 dark:border-blue-800"
        : accent === "orange"
          ? "border-orange-200 dark:border-orange-800"
          : "border-purple-200 dark:border-purple-800"
  const text =
    accent === "green"
      ? "text-green-600 dark:text-green-400"
      : accent === "blue"
        ? "text-blue-600 dark:text-blue-400"
        : accent === "orange"
          ? "text-orange-500 dark:text-orange-400"
          : "text-purple-600 dark:text-purple-400"
  return (
    <div
      className={`rounded-xl border ${ring} flex flex-col gap-1 bg-background px-4 py-3`}
    >
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`text-lg font-bold ${text}`}>{value}</p>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SavingsAccount {
  id: string
  account_number: string
  balance: number
  account_type: string
  is_locked: boolean
  lock_until: string | null
  lock_reason: string | null
  created_at: string
  member_id: string
  member_name: string | null
  member_code: string | null
  member_phone: string | null
}

interface Transaction {
  id: string
  type: string
  amount: number
  balanceAfter: number | null
  paymentMethod: string | null
  narration: string | null
  createdAt: string
}

// ── Main component ────────────────────────────────────────────────────────────

export function SavingsDetailClient({
  account,
  transactions,
}: {
  account: SavingsAccount
  transactions: Transaction[]
}) {
  const router = useRouter()
  const db = usePowerSync()
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [lockOpen, setLockOpen] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  const totalDeposited = transactions
    .filter((t) => t.type === "savings_deposit")
    .reduce((s, t) => s + t.amount, 0)
  const totalWithdrawn = transactions
    .filter((t) => t.type === "savings_withdrawal")
    .reduce((s, t) => s + t.amount, 0)

  // Dialogs expect camelCase accountNumber + snake_case member_name
  const dialogAccount = {
    id: account.id,
    accountNumber: account.account_number,
    member_name: account.member_name ?? "—",
    balance: account.balance,
  }

  const handleUnlock = async () => {
    setUnlocking(true)
    const offline = isOffline()
    if (offline) {
      try {
        await offlineUnlockAccount(db, account.id)
        toast.success("Account unlocked (offline — will sync later)")
        router.refresh()
      } catch {
        toast.error("Failed to unlock offline")
      }
      setUnlocking(false)
      return
    }
    const res = await unlockAccountAction(account.id)
    setUnlocking(false)
    if (res.success) {
      toast.success("Account unlocked")
      router.refresh()
    } else {
      toast.error(res.error ?? "Failed to unlock")
    }
  }

  const refresh = () => router.refresh()

  const accountTypeLabel =
    account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* ── Back + Actions ── */}
      <div className="flex items-center justify-between">
        <Link href="/savings">
          <button className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Savings
          </button>
        </Link>
        <div className="flex items-center gap-2">
          {account.is_locked ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnlock}
              disabled={unlocking}
            >
              <Unlock className="mr-2 h-4 w-4" />
              {unlocking ? "Unlocking…" : "Unlock Account"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLockOpen(true)}
            >
              <Lock className="mr-2 h-4 w-4" />
              Lock Account
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWithdrawOpen(true)}
            disabled={account.is_locked}
          >
            <Minus className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
          <Button
            size="sm"
            onClick={() => setDepositOpen(true)}
            disabled={account.is_locked}
          >
            <Plus className="mr-2 h-4 w-4" />
            Deposit
          </Button>
        </div>
      </div>

      {/* ── Hero bar ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
            <PiggyBank className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="mb-0.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Account Number
            </p>
            <h1 className="font-mono text-xl font-bold text-foreground">
              {account.account_number}
            </h1>
            <p className="text-sm text-muted-foreground">
              {accountTypeLabel} Savings
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize",
            account.is_locked
              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          )}
        >
          {account.is_locked ? "Locked" : "Active"}
        </span>
      </div>

      {/* ── Locked banner ── */}
      {account.is_locked && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Account Locked
            </p>
            {account.lock_reason && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {account.lock_reason}
              </p>
            )}
            {account.lock_until && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Until {formatDate(account.lock_until)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Current Balance"
          value={formatUGX(account.balance)}
          accent="green"
        />
        <StatTile
          label="Total Deposited"
          value={formatUGX(totalDeposited)}
          accent="blue"
        />
        <StatTile
          label="Total Withdrawn"
          value={formatUGX(totalWithdrawn)}
          accent="orange"
        />
        <StatTile
          label="Transactions"
          value={String(transactions.length)}
          accent="purple"
        />
      </div>

      {/* ── Two-col: Account Details + Member ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Account Details */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <SectionHeader icon={PiggyBank} title="Account Details" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <InfoItem label="Account Type" value={accountTypeLabel} />
            <InfoItem
              label="Status"
              value={account.is_locked ? "Locked" : "Active"}
              accent={account.is_locked ? "red" : "green"}
            />
            <InfoItem
              label="Date Opened"
              value={formatDate(account.created_at)}
            />
            {account.lock_until && (
              <InfoItem
                label="Locked Until"
                value={formatDate(account.lock_until)}
                accent="orange"
              />
            )}
            {account.lock_reason && (
              <InfoItem label="Lock Reason" value={account.lock_reason} />
            )}
          </div>
        </div>

        {/* Member Info */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <SectionHeader icon={User} title="Member" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <InfoItem label="Full Name" value={account.member_name ?? "—"} />
            <InfoItem label="Member Code" value={account.member_code ?? "—"} />
            <InfoItem label="Phone" value={account.member_phone ?? "—"} />
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Profile
              </p>
              <Link
                href={`/members/${account.member_id}`}
                className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                View Member →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Transaction History ── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SectionHeader icon={ArrowLeftRight} title="Transaction History" />
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">
                  Date
                </TableHead>
                <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">
                  Type
                </TableHead>
                <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">
                  Amount
                </TableHead>
                <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">
                  Balance After
                </TableHead>
                <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">
                  Method
                </TableHead>
                <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">
                  Narration
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No transactions yet
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="text-sm">
                    <TableCell>{formatDate(tx.createdAt)}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          tx.type === "savings_deposit"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        )}
                      >
                        {tx.type === "savings_deposit" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {tx.type === "savings_deposit" ? "Deposit" : "Withdrawal"}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-semibold",
                        tx.type === "savings_deposit"
                          ? "text-green-600 dark:text-green-400"
                          : "text-orange-600 dark:text-orange-400"
                      )}
                    >
                      {tx.type === "savings_deposit" ? "+" : "−"}
                      {formatUGX(tx.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.balanceAfter != null ? formatUGX(tx.balanceAfter) : "—"}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {tx.paymentMethod
                        ? tx.paymentMethod.replace(/_/g, " ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.narration ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <DepositDialog
        account={dialogAccount}
        open={depositOpen}
        onClose={() => {
          setDepositOpen(false)
          refresh()
        }}
      />
      <WithdrawDialog
        account={dialogAccount}
        open={withdrawOpen}
        onClose={() => {
          setWithdrawOpen(false)
          refresh()
        }}
      />
      <LockDialog
        account={dialogAccount}
        open={lockOpen}
        onClose={() => {
          setLockOpen(false)
          refresh()
        }}
      />
    </div>
  )
}

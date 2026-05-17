import { Badge } from "@/components/ui/badge"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { ArrowDownLeft, ArrowUpRight, Minus, Receipt } from "lucide-react"

interface Transaction {
  id: string
  type: string
  amount: number
  narration: string | null
  created_at: string | null
}

const TYPE_META: Record<
  string,
  {
    label: string
    icon: React.ElementType
    iconBg: string
    iconColor: string
    amountColor: string
    sign: "+" | "-" | ""
    badgeStyle: string
  }
> = {
  savings_deposit: {
    label: "Savings Deposit",
    icon: ArrowDownLeft,
    iconBg: "#10b98115",
    iconColor: "#10b981",
    amountColor: "#10b981",
    sign: "+",
    badgeStyle:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  savings_withdrawal: {
    label: "Withdrawal",
    icon: ArrowUpRight,
    iconBg: "#ef444415",
    iconColor: "#ef4444",
    amountColor: "#ef4444",
    sign: "-",
    badgeStyle:
      "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  loan_disbursement: {
    label: "Loan Disbursed",
    icon: ArrowUpRight,
    iconBg: "#f9731615",
    iconColor: "#f97316",
    amountColor: "#f97316",
    sign: "-",
    badgeStyle:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  loan_repayment: {
    label: "Loan Repayment",
    icon: ArrowDownLeft,
    iconBg: "#6366f115",
    iconColor: "#6366f1",
    amountColor: "#6366f1",
    sign: "+",
    badgeStyle:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  fine_payment: {
    label: "Fine Payment",
    icon: Minus,
    iconBg: "#eab30815",
    iconColor: "#eab308",
    amountColor: "#eab308",
    sign: "-",
    badgeStyle:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  },
}

const FALLBACK = {
  label: "",
  icon: Minus,
  iconBg: "hsl(var(--muted))",
  iconColor: "hsl(var(--muted-foreground))",
  amountColor: "hsl(var(--foreground))",
  sign: "" as const,
  badgeStyle: "bg-muted text-muted-foreground border-border",
}

export function RecentTransactions({
  transactions,
}: {
  transactions: Transaction[]
}) {
  if (!transactions) transactions = []
  return (
    <div className="overflow-hidden rounded border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-widest text-foreground uppercase">
              Recent Transactions
            </p>
            <p className="text-xs text-muted-foreground">
              Latest financial activity
            </p>
          </div>
        </div>
        {transactions.length > 0 && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {transactions.length} entries
          </span>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Receipt className="h-5 w-5 opacity-30" />
          </div>
          <p className="text-sm">No transactions yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {transactions.map((tx) => {
            const meta = TYPE_META[tx.type] ?? { ...FALLBACK, label: tx.type }
            const Icon = meta.icon

            return (
              <div
                key={tx.id}
                className="group relative flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/30"
              >
                {/* Left color bar */}
                <div
                  className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: meta.iconColor }}
                />

                {/* Icon */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                  style={{ background: meta.iconBg }}
                >
                  <Icon className="h-4 w-4" style={{ color: meta.iconColor }} />
                </div>

                {/* Description + date */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm leading-snug font-medium text-foreground">
                    {tx.narration ?? meta.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                    {formatDate(tx.created_at)}
                  </p>
                </div>

                {/* Badge */}
                <div className="hidden shrink-0 sm:block">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.badgeStyle}`}
                  >
                    {meta.label || tx.type.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Amount */}
                <div className="min-w-[90px] shrink-0 text-right">
                  <p
                    className="text-sm font-bold tabular-nums"
                    style={{ color: meta.amountColor }}
                  >
                    {meta.sign}
                    {formatUGX(tx.amount)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

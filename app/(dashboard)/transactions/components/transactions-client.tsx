"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@powersync/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Download, Receipt } from "lucide-react"
import { TransactionsTable } from "./transactions-table"
import ExcelJS from "exceljs"
import { toast } from "sonner"
import { formatUGX } from "@/lib/utils/format"

interface TransactionsClientProps {
  saccoId: string
}

type Transaction = {
  id: string
  type: string
  amount: number
  balanceAfter: number | null
  paymentMethod: string | null
  narration: string | null
  createdAt: string | null
  memberId: string
  memberName: string | null
  memberCode: string | null
}

const TRANSACTION_TYPES = [
  "all",
  "savings_deposit",
  "savings_withdrawal",
  "loan_disbursement",
  "loan_repayment",
  "fine_payment",
] as const

export function TransactionsClient({ saccoId }: TransactionsClientProps) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  const { data: rows = [] } = useQuery(
    `SELECT t.id, t.type, t.amount, t.balance_after, t.payment_method, t.narration, t.created_at, t.member_id,
            m.full_name AS member_name, m.member_code AS member_code
     FROM transactions t
     LEFT JOIN members m ON m.id = t.member_id AND m.sacco_id = ?
     WHERE t.sacco_id = ?
     ORDER BY t.created_at DESC`,
    [saccoId, saccoId]
  )

  const transactions: Transaction[] = useMemo(
    () =>
      (rows as any[]).map((r) => ({
        id: r.id,
        type: r.type ?? "",
        amount: r.amount ?? 0,
        balanceAfter: r.balance_after ?? null,
        paymentMethod: r.payment_method ?? null,
        narration: r.narration ?? null,
        createdAt: r.created_at ?? null,
        memberId: r.member_id,
        memberName: r.member_name ?? null,
        memberCode: r.member_code ?? null,
      })),
    [rows]
  )

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        const matchesSearch =
          !search ||
          (t.memberName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (t.memberCode ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (t.narration ?? "").toLowerCase().includes(search.toLowerCase())
        const matchesType = typeFilter === "all" || t.type === typeFilter
        return matchesSearch && matchesType
      }),
    [transactions, search, typeFilter]
  )

  const handleExcelExport = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Transactions")
    worksheet.columns = [
      { header: "Member", key: "member", width: 25 },
      { header: "Code", key: "code", width: 15 },
      { header: "Type", key: "type", width: 20 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Payment Method", key: "payment_method", width: 18 },
      { header: "Narration", key: "narration", width: 30 },
      { header: "Date", key: "date", width: 20 },
    ]
    worksheet.addRows(
      filtered.map((t) => ({
        member: t.memberName ?? "-",
        code: t.memberCode ?? "-",
        type: t.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        amount: formatUGX(t.amount),
        payment_method: t.paymentMethod ?? "-",
        narration: t.narration ?? "-",
        date: t.createdAt ? new Date(t.createdAt).toLocaleString("en-UG") : "-",
      }))
    )
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sacco-transactions.xlsx"
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Transactions exported to Excel")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {transactions.length} total transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExcelExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {TRANSACTION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type === "all"
                  ? "All Types"
                  : type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 sm:w-72">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search member, code, narration..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <TransactionsTable transactions={filtered} />
    </div>
  )
}

"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@powersync/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Download } from "lucide-react"
import { ExpensesTable } from "./expenses-table"
import { AddExpenseDialog } from "./add-expense-dialog"
import ExcelJS from "exceljs"
import { toast } from "sonner"
import { formatUGX, formatDate } from "@/lib/utils/format"

interface ExpensesClientProps {
  saccoId: string
}

export function ExpensesClient({ saccoId }: ExpensesClientProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<any>(null)
  const [search, setSearch] = useState("")

  const { data: rows = [] } = useQuery(
    `SELECT * FROM expenses WHERE sacco_id = ? ORDER BY created_at DESC`,
    [saccoId]
  )

  const expenses = useMemo(() => (rows as any[]).map((r) => ({
    id: r.id, category: r.category, amount: Number(r.amount),
    description: r.description ?? "", paymentMethod: r.payment_method ?? "cash",
    reference: r.reference ?? null, paidBy: r.paid_by ?? null,
    paidAt: r.paid_at ? new Date(r.paid_at) : null,
    notes: r.notes ?? null,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  })), [rows])

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0)

  const filtered = useMemo(() => {
    if (!search) return expenses
    return expenses.filter(
      (e) =>
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.category?.toLowerCase().includes(search.toLowerCase()) ||
        (e.reference ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [expenses, search])

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Expenses")
    sheet.columns = [
      { header: "Category", key: "category", width: 18 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Payment", key: "payment", width: 15 },
      { header: "Description", key: "desc", width: 30 },
      { header: "Reference", key: "ref", width: 20 },
      { header: "Paid Date", key: "date", width: 15 },
    ]
    sheet.addRows(filtered.map((e) => ({
      category: e.category, amount: formatUGX(e.amount),
      payment: e.paymentMethod, desc: e.description,
      ref: e.reference ?? "-",
      date: e.paidAt ? e.paidAt.toISOString().split("T")[0] : "-",
    })))
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "lendwell-expenses.xlsx"
    a.click(); window.URL.revokeObjectURL(url)
    toast.success("Expenses exported")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {expenses.length} total · {formatUGX(totalAmount)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)} className="bg-orange-600 text-white hover:bg-orange-700">
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search expenses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <p className="shrink-0 text-sm text-muted-foreground">{filtered.length} of {expenses.length}</p>
      </div>

      <ExpensesTable expenses={filtered} saccoId={saccoId} onEdit={setEditExpense} />

      <AddExpenseDialog open={addOpen} onClose={() => setAddOpen(false)} saccoId={saccoId} />
      {editExpense && (
        <AddExpenseDialog open={!!editExpense} onClose={() => setEditExpense(null)} expense={editExpense} saccoId={saccoId} />
      )}
    </div>
  )
}

"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Download } from "lucide-react"
import { FinesTable } from "./fines-table"
import { AddFineDialog } from "./add-fine-dialog"
import ExcelJS from "exceljs"
import { toast } from "sonner"

interface FinesClientProps {
  fines: any[]
  stats: {
    totalAmount: number
    totalCount: number
    pendingAmount: number
    pendingCount: number
    paidAmount: number
    paidCount: number
    waivedCount: number
  }
  members: any[]
  categories: any[]
}

export const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export const statusConfig: Record<string, { color: string; label: string }> = {
  pending: {
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    label: "Pending",
  },
  paid: {
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    label: "Paid",
  },
  waived: {
    color: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
    label: "Waived",
  },
}

export function FinesClient({
  fines,
  stats,
  members,
  categories,
}: FinesClientProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return fines.filter((f) =>
      f.member_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.fineRef?.toLowerCase().includes(search.toLowerCase()) ||
      f.reason?.toLowerCase().includes(search.toLowerCase()) ||
      f.memberCode?.toLowerCase().includes(search.toLowerCase())
    )
  }, [fines, search])

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Fines")

    worksheet.columns = [
      { header: "Fine Ref", key: "fine_ref", width: 15 },
      { header: "Member", key: "member", width: 25 },
      { header: "Member Code", key: "member_code", width: 15 },
      { header: "Category", key: "category", width: 15 },
      { header: "Amount (UGX)", key: "amount", width: 15 },
      { header: "Reason", key: "reason", width: 30 },
      { header: "Priority", key: "priority", width: 10 },
      { header: "Status", key: "status", width: 10 },
      { header: "Due Date", key: "due_date", width: 15 },
      { header: "Paid At", key: "paid_at", width: 15 },
      { header: "Payment Method", key: "payment_method", width: 15 },
      { header: "Date", key: "date", width: 15 },
    ]

    const data = filtered.map((f) => ({
      fine_ref: f.fineRef,
      member: f.member_name,
      member_code: f.memberCode,
      category: f.category_name ?? "",
      amount: f.amount / 100,
      reason: f.reason,
      priority: f.priority,
      status: f.status,
      due_date: f.dueDate ?? "",
      paid_at: f.paidAt ? new Date(f.paidAt).toLocaleDateString() : "",
      payment_method: f.paymentMethod ?? "",
      date: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "",
    }))

    worksheet.addRows(data)

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sacco-fines.xlsx"
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success("Fines exported to Excel")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fines</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.totalCount} total fines issued
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button
            size="sm"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Issue Fine
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="shrink-0 text-sm text-muted-foreground">
          {filtered.length} of {fines.length} fines
        </p>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search member, ref, reason..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <FinesTable fines={filtered} />

      <AddFineDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        members={members}
        categories={categories}
      />
    </div>
  )
}

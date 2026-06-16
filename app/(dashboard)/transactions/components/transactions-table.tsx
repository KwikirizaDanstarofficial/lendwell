"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowDownLeft, ArrowUpRight, Minus } from "lucide-react"
import { formatUGX } from "@/lib/utils/format"

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

const TYPE_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string; sign: "+" | "-" | "" }
> = {
  savings_deposit: {
    label: "Savings Deposit",
    icon: ArrowDownLeft,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    sign: "+",
  },
  savings_withdrawal: {
    label: "Withdrawal",
    icon: ArrowUpRight,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    sign: "-",
  },
  loan_disbursement: {
    label: "Loan Disbursed",
    icon: ArrowUpRight,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    sign: "-",
  },
  loan_repayment: {
    label: "Loan Repayment",
    icon: ArrowDownLeft,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    sign: "+",
  },
  fine_payment: {
    label: "Fine Payment",
    icon: Minus,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
    sign: "-",
  },
}

function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—"
  return new Date(date).toLocaleString("en-UG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<Transaction>[] = [
    {
      id: "member",
      header: "Member",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs">{row.original.memberName ?? "—"}</span>
          {row.original.memberCode && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {row.original.memberCode}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const meta = TYPE_META[row.original.type]
        if (!meta) {
          return (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {row.original.type.replace(/_/g, " ")}
            </span>
          )
        }
        const Icon = meta.icon
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.bg} ${meta.color}`}
          >
            <Icon className="h-3 w-3" />
            {meta.label}
          </span>
        )
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const meta = TYPE_META[row.original.type]
        const sign = meta?.sign ?? ""
        const color = meta?.color ?? "text-foreground"
        return (
          <span className={`text-sm font-bold tabular-nums ${color}`}>
            {sign}
            {formatUGX(row.original.amount)}
          </span>
        )
      },
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment",
      cell: ({ row }) => {
        const method = row.original.paymentMethod
        if (!method) return <span className="text-xs text-muted-foreground">—</span>
        return (
          <span className="text-xs capitalize">
            {method.replace(/_/g, " ")}
          </span>
        )
      },
    },
    {
      accessorKey: "narration",
      header: "Narration",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
          {row.original.narration ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Date & Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
  ]

  const table = useReactTable({
    data: transactions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  })

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => router.push(`/members/${row.original.memberId}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}

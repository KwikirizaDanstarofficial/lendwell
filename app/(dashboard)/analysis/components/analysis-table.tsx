"use client"

import { useState } from "react"
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
import { ArrowUpDown, AlertCircle } from "lucide-react"
import { formatUGX, formatDate } from "@/lib/utils/format"

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  approved: "bg-blue-500/10 text-blue-600",
  disbursed: "bg-purple-500/10 text-purple-600",
  active: "bg-emerald-500/10 text-emerald-600",
  settled: "bg-gray-500/10 text-gray-600",
  declined: "bg-red-500/10 text-red-600",
  defaulted: "bg-red-500/20 text-red-700",
  extended: "bg-orange-500/10 text-orange-600",
}

interface LoanItem {
  id: string; memberId: string; loanRef: string; amount: number; balance: number
  status: string; dueDate: Date | null; memberName: string | null; memberCode: string | null
  disbursedAt: Date | null
}

export function AnalysisTable({ items, label }: { items: LoanItem[]; label: string }) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<LoanItem>[] = [
    {
      id: "member",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-semibold hover:bg-transparent">
          Member <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium leading-tight">{row.original.memberName ?? "—"}</p>
          <p className="font-mono text-xs text-muted-foreground">{row.original.memberCode}</p>
        </div>
      ),
    },
    {
      accessorKey: "loanRef",
      header: "Loan Ref",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.loanRef}</span>,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-semibold hover:bg-transparent">
          Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-xs font-semibold tabular-nums">{formatUGX(row.original.amount)}</span>,
    },
    {
      accessorKey: "balance",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-semibold hover:bg-transparent">
          Balance <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-xs font-semibold tabular-nums">{formatUGX(row.original.balance)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const style = STATUS_STYLES[row.original.status] ?? "bg-muted text-muted-foreground"
        return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>{row.original.status}</span>
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-semibold hover:bg-transparent">
          Due Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.dueDate ? formatDate(row.original.dueDate) : "—"}</span>,
    },
    {
      accessorKey: "disbursedAt",
      header: "Disbursed",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.disbursedAt ? formatDate(row.original.disbursedAt) : "—"}</span>,
    },
  ]

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-16 text-muted-foreground">
        <AlertCircle className="mb-3 h-10 w-10 opacity-30" />
        <p className="text-base font-medium">No {label.toLowerCase()} loans</p>
        <p className="mt-1 text-sm">No loans match this category</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </>
  )
}

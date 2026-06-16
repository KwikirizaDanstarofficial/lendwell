"use client"

import { useState } from "react"
import { usePowerSync } from "@powersync/react"
import { offlineDeleteBankingTransaction } from "@/lib/powersync/offline-mutations"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Trash2, ArrowUpDown, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { toast } from "sonner"
import { isOffline } from "@/lib/utils/is-offline"

type Transaction = {
  id: string; accountId: string; type: string; amount: number
  description: string; reference: string | null; transactedBy: string | null
  createdAt: Date | null; accountName?: string
}

export function TransactionsTable({ transactions, saccoId, bankAccounts }: { transactions: Transaction[]; saccoId: string; bankAccounts: { id: string; bankName: string; accountName: string; accountNumber: string }[] }) {
  const db = usePowerSync()
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [txnToDelete, setTxnToDelete] = useState<string | null>(null)

  const accountMap = Object.fromEntries(bankAccounts.map((a) => [a.id, `${a.bankName} — ${a.accountName}`]))

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-semibold hover:bg-transparent">
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.createdAt ? formatDate(row.original.createdAt) : "—"}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const isDeposit = row.original.type === "deposit"
        return (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${isDeposit ? "text-green-600" : "text-red-600"}`}>
            {isDeposit ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            {isDeposit ? "Deposit" : "Withdrawal"}
          </span>
        )
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-semibold hover:bg-transparent">
          Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const isDeposit = row.original.type === "deposit"
        return <span className={`font-semibold text-xs tabular-nums ${isDeposit ? "text-green-600" : "text-red-600"}`}>{isDeposit ? "+" : "-"}{formatUGX(row.original.amount)}</span>
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span className="max-w-[200px] truncate text-xs">{row.original.description}</span>,
    },
    {
      id: "account",
      header: "Account",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{accountMap[row.original.accountId] ?? "—"}</span>,
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.reference ?? "—"}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive" onClick={() => { setTxnToDelete(row.original.id); setDeleteDialogOpen(true) }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
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
    initialState: { pagination: { pageSize: 10 } },
  })

  const handleDelete = async () => {
    if (!txnToDelete) return
    if (isOffline()) {
      await offlineDeleteBankingTransaction(db, txnToDelete)
      toast.success("Transaction deleted offline")
    } else {
      const { deleteBankingTransactionAction } = await import("../actions")
      const result = await deleteBankingTransactionAction(txnToDelete)
      if (result.error) toast.error(result.error)
      else toast.success("Transaction deleted")
    }
    setDeleteDialogOpen(false)
    setTxnToDelete(null)
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
                <TableCell colSpan={columns.length} className="h-24 text-center">No transactions found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

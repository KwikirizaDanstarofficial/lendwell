"use client"

import { useState } from "react"
import { usePowerSync } from "@powersync/react"
import { offlineDeleteExpense } from "@/lib/powersync/offline-mutations"
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
import { MoreHorizontal, Pencil, Trash2, ArrowUpDown, Calendar } from "lucide-react"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { toast } from "sonner"
import { isOffline } from "@/lib/utils/is-offline"

const CATEGORY_LABELS: Record<string, string> = {
  utilities: "Utilities", rent: "Rent", salaries: "Salaries", supplies: "Supplies",
  maintenance: "Maintenance", transportation: "Transportation", communication: "Communication",
  marketing: "Marketing", insurance: "Insurance", taxes: "Taxes", legal: "Legal",
  training: "Training", equipment: "Equipment", software: "Software", other: "Other",
}

const CATEGORY_STYLES: Record<string, string> = {
  utilities: "bg-yellow-500/10 text-yellow-600", rent: "bg-purple-500/10 text-purple-600",
  salaries: "bg-blue-500/10 text-blue-600", supplies: "bg-cyan-500/10 text-cyan-600",
  maintenance: "bg-orange-500/10 text-orange-600", transportation: "bg-indigo-500/10 text-indigo-600",
  communication: "bg-pink-500/10 text-pink-600", marketing: "bg-rose-500/10 text-rose-600",
  insurance: "bg-teal-500/10 text-teal-600", taxes: "bg-red-500/10 text-red-600",
  legal: "bg-violet-500/10 text-violet-600", training: "bg-green-500/10 text-green-600",
  equipment: "bg-slate-500/10 text-slate-600", software: "bg-gray-500/10 text-gray-600",
  other: "bg-muted text-muted-foreground",
}

type Expense = {
  id: string; category: string; amount: number; description: string
  paymentMethod: string; reference: string | null; paidBy: string | null
  paidAt: Date | null; notes: string | null; createdAt: Date | null
}

export function ExpensesTable({ expenses, saccoId, onEdit }: { expenses: Expense[]; saccoId: string; onEdit: (e: Expense) => void }) {
  const db = usePowerSync()
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "category",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-semibold hover:bg-transparent">
          Category <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const style = CATEGORY_STYLES[row.original.category] ?? CATEGORY_STYLES.other
        return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>{CATEGORY_LABELS[row.original.category] ?? row.original.category}</span>
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-semibold hover:bg-transparent">
          Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-semibold text-xs tabular-nums">{formatUGX(row.original.amount)}</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span className="max-w-[200px] truncate text-xs">{row.original.description || "—"}</span>,
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment",
      cell: ({ row }) => <span className="text-xs capitalize text-muted-foreground">{row.original.paymentMethod.replace(/_/g, " ")}</span>,
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.reference ?? "—"}</span>,
    },
    {
      accessorKey: "paidAt",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-semibold hover:bg-transparent">
          Paid Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {row.original.paidAt ? <><Calendar className="h-3 w-3" />{formatDate(row.original.paidAt)}</> : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const expense = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(expense)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => { setExpenseToDelete(expense.id); setDeleteDialogOpen(true) }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: expenses,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const handleDelete = async () => {
    if (!expenseToDelete) return
    if (isOffline()) {
      await offlineDeleteExpense(db, expenseToDelete)
      toast.success("Expense deleted offline")
    } else {
      const { error } = await import("@/lib/supabase/client").then((m) =>
        m.supabase.from("expenses").delete().eq("id", expenseToDelete)
      ).catch(() => ({ error: { message: "Failed to delete" } }))
      if (error) toast.error(error.message)
      else toast.success("Expense deleted")
    }
    setDeleteDialogOpen(false)
    setExpenseToDelete(null)
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
                <TableCell colSpan={columns.length} className="h-24 text-center">No expenses found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
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

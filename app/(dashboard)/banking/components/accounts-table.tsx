"use client"

import { useState } from "react"
import { usePowerSync } from "@powersync/react"
import { offlineDeleteBankAccount } from "@/lib/powersync/offline-mutations"
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
import { MoreHorizontal, Pencil, Trash2, ArrowUpDown, Building2, BadgeCheck, BadgeX } from "lucide-react"
import { toast } from "sonner"
import { isOffline } from "@/lib/utils/is-offline"

type BankAccount = {
  id: string; bankName: string; accountName: string; accountNumber: string
  branch: string | null; isActive: boolean; createdAt: Date | null
}

export function AccountsTable({ accounts, saccoId, onEdit }: { accounts: BankAccount[]; saccoId: string; onEdit: (a: BankAccount) => void }) {
  const db = usePowerSync()
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)

  const columns: ColumnDef<BankAccount>[] = [
    {
      accessorKey: "bankName",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-semibold hover:bg-transparent">
          <Building2 className="mr-2 h-4 w-4" /> Bank <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium text-xs">{row.original.bankName}</span>,
    },
    {
      accessorKey: "accountName",
      header: "Account Name",
      cell: ({ row }) => <span className="text-xs">{row.original.accountName}</span>,
    },
    {
      accessorKey: "accountNumber",
      header: "Account Number",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.accountNumber}</span>,
    },
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.branch ?? "—"}</span>,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => row.original.isActive
        ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><BadgeCheck className="h-3.5 w-3.5" /> Active</span>
        : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><BadgeX className="h-3.5 w-3.5" /> Inactive</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const account = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(account)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => { setAccountToDelete(account.id); setDeleteDialogOpen(true) }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: accounts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const handleDelete = async () => {
    if (!accountToDelete) return
    if (isOffline()) {
      await offlineDeleteBankAccount(db, accountToDelete)
      toast.success("Account deleted offline")
    } else {
      const { deleteBankAccountAction } = await import("../actions")
      const result = await deleteBankAccountAction(accountToDelete)
      if (result.error) toast.error(result.error)
      else toast.success("Account deleted")
    }
    setDeleteDialogOpen(false)
    setAccountToDelete(null)
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
                <TableCell colSpan={columns.length} className="h-24 text-center">No bank accounts found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bank Account?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Existing transactions linked to this account will remain.</AlertDialogDescription>
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

"use client"

import { useState } from "react"
import { usePowerSync } from "@powersync/react"
import { offlineMarkFinePaid, offlineWaiveFine, offlineDeleteFine } from "@/lib/powersync/offline-mutations"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  ArrowUpDown,
  Calendar,
} from "lucide-react"
import { markFinePaidAction, waiveFineAction, deleteFineAction } from "../actions"
import { toast } from "sonner"
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
import { statusConfig } from "./fines-client"
import { formatDate, formatUGX } from "@/lib/utils/format"
import { isOffline } from "@/lib/utils/is-offline"

type Fine = {
  id: string
  fine_ref: string
  fineRef: string
  amount: number
  reason: string
  status: string
  due_date: Date | null
  paid_at: Date | null
  payment_method: string | null
  payment_reference: string | null
  notes: string | null
  createdAt: Date | null
  member_id: string
  category_id: string
  member_name: string
  memberCode: string
  category_name: string
}

export function FinesTable({ fines }: { fines: Fine[] }) {
  const db = usePowerSync()
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fineToDelete, setFineToDelete] = useState<string | null>(null)

  const columns: ColumnDef<Fine>[] = [
    {
      accessorKey: "fineRef",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Fine Ref
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.fineRef}</span>
      ),
    },
    {
      id: "member",
      header: "Member",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-xs">{row.original.member_name}</p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {row.original.memberCode}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "category_name",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.category_name || "-"}</span>
      ),
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
      cell: ({ row }) => (
        <span className="font-semibold text-xs">
          {formatUGX(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate text-xs">
          {row.original.reason}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const cfg = statusConfig[row.original.status] ?? {
          color: "bg-gray-100 text-gray-600",
          label: row.original.status,
        }
        return <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
      },
    },
    {
      accessorKey: "due_date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {row.original.due_date ? formatDate(row.original.due_date) : "-"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const fine = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {fine.status === "pending" && (
                <DropdownMenuItem
                  onClick={async () => {
                    if (isOffline()) {
                      await offlineMarkFinePaid(db, fine.id)
                      toast.success("Marked as paid offline")
                    } else {
                      const fd = new FormData()
                      fd.set("id", fine.id)
                      const res = await markFinePaidAction({}, fd)
                      if (res.success) toast.success("Fine marked as paid")
                      else toast.error(res.error)
                    }
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Mark Paid
                </DropdownMenuItem>
              )}
              {fine.status === "pending" && (
                <DropdownMenuItem
                  onClick={async () => {
                    const reason = prompt("Waiver reason:")
                    if (!reason) return
                    if (isOffline()) {
                      await offlineWaiveFine(db, fine.id)
                      toast.success("Fine waived offline")
                    } else {
                      const res = await waiveFineAction(fine.id, reason)
                      if (res.success) toast.success("Fine waived")
                      else toast.error(res.error)
                    }
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4 text-orange-600" />
                  Waive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  setFineToDelete(fine.id)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: fines,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const handleDelete = async () => {
    if (!fineToDelete) return
    if (isOffline()) {
      await offlineDeleteFine(db, fineToDelete)
      toast.success("Fine deleted offline")
    } else {
      const res = await deleteFineAction(fineToDelete)
      if (res.success) toast.success("Fine deleted")
      else toast.error(res.error)
    }
    setDeleteDialogOpen(false)
    setFineToDelete(null)
  }

  return (
    <>
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
                <TableRow key={row.id}>
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
                  No fines found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
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

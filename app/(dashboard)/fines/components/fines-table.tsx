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
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Trash2,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { deleteFineAction } from "../actions"
import { PayFineDialog } from "./pay-fine-dialog"
import { WaiveFineDialog } from "./waive-fine-dialog"
import { priorityColors, statusConfig } from "./fines-client"

export function FinesTable({ fines }: { fines: any[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [payFine, setPayFine] = useState<any>(null)
  const [waiveFine, setWaiveFine] = useState<any>(null)
  const [deleteFine, setDeleteFine] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteFine) return
    setDeleting(true)
    const res = await deleteFineAction(deleteFine.id)
    setDeleting(false)
    if (res.success) {
      toast.success("Fine deleted")
      setDeleteFine(null)
    } else {
      toast.error(res.error)
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "fine_ref",
      header: "Ref",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.fineRef ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "member_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-semibold hover:bg-transparent"
        >
          Member
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.member_name}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {row.original.memberCode}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "category_name",
      header: "Category",
      cell: ({ row }) => row.original.category_name ?? "—",
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-semibold hover:bg-transparent"
        >
          Amount
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-red-600">
          {formatUGX(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.reason ?? "—"}</span>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Badge variant={row.original.priority === "urgent" ? "destructive" : row.original.priority === "high" ? "destructive" : "secondary"}>
          {row.original.priority ?? "normal"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const cfg = statusConfig[row.original.status] ?? statusConfig.pending
        return (
          <Badge variant={row.original.status === "paid" ? "default" : row.original.status === "waived" ? "outline" : "secondary"}>
            {cfg.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "due_date",
      header: "Due",
      cell: ({ row }) => formatDate(row.original.dueDate),
    },
    {
      accessorKey: "created_at",
      header: "Issued",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const fine = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {fine.status === "pending" && (
                <>
                  <DropdownMenuItem
                    className="text-green-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPayFine(fine)
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      setWaiveFine(fine)
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Waive Fine
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteFine(fine)
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
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  if (fines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border rounded-lg text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-lg font-medium">No fines found</p>
        <p className="text-sm mt-1">Issue your first fine to get started</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/50">
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/30">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      {payFine && (
        <PayFineDialog
          fine={payFine}
          open={!!payFine}
          onClose={() => setPayFine(null)}
        />
      )}
      {waiveFine && (
        <WaiveFineDialog
          fine={waiveFine}
          open={!!waiveFine}
          onClose={() => setWaiveFine(null)}
        />
      )}

      <AlertDialog open={!!deleteFine} onOpenChange={() => setDeleteFine(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fine?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete fine{" "}
              <strong>{deleteFine?.fine_ref}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
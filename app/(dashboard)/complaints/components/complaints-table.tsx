"use client"
"use client"

import { useState } from "react"
import { usePowerSync } from "@powersync/react"
import { offlineDeleteComplaint } from "@/lib/powersync/offline-mutations"
import { useRouter } from "next/navigation"
import { useSyncNow } from "@/lib/powersync/provider"
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
  Pencil,
  Trash2,
  ArrowUpDown,
  Calendar,
  User,
} from "lucide-react"
import { deleteComplaintAction } from "../actions"
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
import { formatDate } from "@/lib/utils/format"
import { isOffline } from "@/lib/utils/is-offline"

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "secondary",
  in_progress: "default",
  resolved: "outline",
}

const categoryVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  general: "outline",
  loan: "default",
  savings: "secondary",
  service: "outline",
  technical: "destructive",
  other: "outline",
}

const priorityVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "outline",
  normal: "secondary",
  high: "destructive",
  urgent: "destructive",
}

export interface Complaint {
  id: string
  saccoId: string
  memberId: string | null
  complaintRef: string | null
  subject: string
  body: string
  category: string | null
  priority: string | null
  status: string | null
  assignedTo: string | null
  resolutionNotes: string | null
  resolvedAt: Date | null
  resolvedBy: string | null
  satisfactionRating: number | null
  feedback: string | null
  notes: string | null
  createdAt: Date | null
  updatedAt: Date | null
  memberName: string | null
  memberCode: string | null
  memberPhone: string | null
}

interface ComplaintsTableProps {
  complaints: Complaint[]
}

export function ComplaintsTable({ complaints }: ComplaintsTableProps) {
  const db = usePowerSync()
  const { syncNow } = useSyncNow()
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [complaintToDelete, setComplaintToDelete] = useState<string | null>(
    null
  )

  const columns: ColumnDef<Complaint>[] = [
    {
      accessorKey: "complaint_ref",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Ref
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <p className="font-mono text-sm">{row.original.complaintRef || "—"}</p>
      ),
    },
    {
      accessorKey: "subject",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Subject
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.subject}</p>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {row.original.body}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "member_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Member
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">
              {row.original.memberName || "Unknown"}
            </p>
            <p className="text-sm text-muted-foreground">
              {row.original.memberCode || "N/A"}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.category === "loan"
              ? "default"
              : row.original.category === "savings"
                ? "secondary"
                : "outline"
          }
        >
          {row.original.category || "general"}
        </Badge>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.priority === "urgent"
              ? "destructive"
              : row.original.priority === "high"
                ? "destructive"
                : "secondary"
          }
        >
          {row.original.priority || "normal"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "resolved"
              ? "outline"
              : row.original.status === "in_progress"
                ? "default"
                : "secondary"
          }
        >
          {row.original.status || "open"}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {row.original.createdAt ? formatDate(row.original.createdAt) : "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "resolved_at",
      header: "Resolved",
      cell: ({ row }) =>
        row.original.resolvedAt ? formatDate(row.original.resolvedAt) : "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-md p-1 hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/complaints/${row.original.id}`)
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/complaints/${row.original.id}/edit`)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setComplaintToDelete(row.original.id)
                setDeleteDialogOpen(true)
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: complaints,
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

  if (complaints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-muted-foreground">
        <p className="text-lg font-medium">No complaints found</p>
        <p className="mt-1 text-sm">Add your first complaint to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
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
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => router.push(`/complaints/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Complaint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this complaint? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (complaintToDelete) {
                  if (isOffline()) {
                    await offlineDeleteComplaint(db, complaintToDelete).catch(() => {})
                    toast.success("Complaint deleted offline — will sync when connected.")
                    setDeleteDialogOpen(false)
                    setComplaintToDelete(null)
                    return
                  }
                  const result = await deleteComplaintAction(complaintToDelete)
                  if (result.success) {
                    toast.success("Complaint deleted successfully")
                    syncNow()
                  } else {
                    toast.error(result.error || "Failed to delete complaint")
                  }
                  setDeleteDialogOpen(false)
                  setComplaintToDelete(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

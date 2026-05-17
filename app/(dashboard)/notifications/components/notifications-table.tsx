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
import { deleteNotificationAction } from "../actions"
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

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  sent: "default",
  pending: "secondary",
  failed: "destructive",
}

const typeVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  sms: "default",
  in_app: "secondary",
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

const channelVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  sms: "default",
  email: "secondary",
  push: "outline",
  in_app: "secondary",
}

interface Notification {
  id: string
  sacco_id: string
  member_id: string | null
  title: string
  body: string
  type: string | null
  status: string | null
  priority: string | null
  channel: string | null
  recipient_phone: string | null
  recipient_email: string | null
  reference_type: string | null
  reference_id: string | null
  metadata: string | null
  retry_count: number | null
  max_retries: number | null
  error_message: string | null
  scheduled_at: Date | null
  sent_at: Date | null
  delivered_at: Date | null
  read_at: Date | null
  created_at: Date | null
  updated_at: Date | null
  member_name: string | null
  member_code: string | null
}

interface NotificationsTableProps {
  notifications: Notification[]
}

export function NotificationsTable({ notifications }: NotificationsTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<
    string | null
  >(null)

  const columns: ColumnDef<Notification>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {row.original.body}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={row.original.type === "sms" ? "default" : "secondary"}>
          {row.original.type || "sms"}
        </Badge>
      ),
    },
    {
      accessorKey: "channel",
      header: "Channel",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.channel === "sms"
              ? "default"
              : row.original.channel === "email"
                ? "secondary"
                : "outline"
          }
        >
          {row.original.channel || "sms"}
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
              {row.original.member_name || "Unknown"}
            </p>
            <p className="text-sm text-muted-foreground">
              {row.original.member_code || "N/A"}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "sent"
              ? "default"
              : row.original.status === "failed"
                ? "destructive"
                : "secondary"
          }
        >
          {row.original.status || "pending"}
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
          {row.original.created_at
            ? formatDate(row.original.created_at)
            : "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "sent_at",
      header: "Sent",
      cell: ({ row }) =>
        row.original.sent_at ? formatDate(row.original.sent_at) : "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-md p-1 hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/notifications/${row.original.id}`)
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/notifications/${row.original.id}/edit`)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setNotificationToDelete(row.original.id)
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
    data: notifications,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 7,
      },
    },
  })

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-muted-foreground">
        <p className="text-lg font-medium">No notifications found</p>
        <p className="mt-1 text-sm">
          Send your first notification to get started
        </p>
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
                onClick={() => router.push(`/notifications/${row.original.id}`)}
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
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (notificationToDelete) {
                  const result =
                    await deleteNotificationAction(notificationToDelete)
                  if (result.success) {
                    toast.success("Notification deleted successfully")
                  } else {
                    toast.error(result.error || "Failed to delete notification")
                  }
                  setDeleteDialogOpen(false)
                  setNotificationToDelete(null)
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

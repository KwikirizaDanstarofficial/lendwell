"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePowerSync } from "@powersync/react"
import { offlineDeleteMember } from "@/lib/powersync/offline-mutations"
import { isOffline } from "@/lib/utils/is-offline"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
  Eye,
  Pencil,
  Trash2,
  Banknote,
  PiggyBank,
  ArrowUpDown,
  Phone,
  Mail,
  Loader2,
} from "lucide-react"
import { deleteMemberAction } from "../actions"
import { formatDate, formatUGX } from "@/lib/utils/format"
import { toast } from "sonner"

type Member = {
  id: string
  saccoId: string
  memberCode: string
  fullName: string
  email: string | null
  phone: string | null
  nationalId: string | null
  photoUrl: string | null
  dateOfBirth: Date | null
  address: string | null
  nextOfKin: string | null
  nextOfKinPhone: string | null
  nextOfKinRelationship: string | null
  nextOfKinAddress: string | null
  status: "active" | "suspended" | "exited"
  joinedAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  totalSavings?: number
  totalLoans?: number
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  suspended: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  exited: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export function MembersTable({ members }: { members: Member[] }) {
  const db = usePowerSync()
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)
  const [deleting, setDeleting] = useState(false)

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "memberCode",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Code
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.memberCode}</span>
      ),
    },
    {
      id: "name",
      header: "Full Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={row.original.photoUrl ?? undefined} />
            <AvatarFallback className="text-[10px]">
              {row.original.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-xs">{row.original.fullName}</span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) =>
        row.original.phone ? (
          <span className="flex items-center gap-1 text-xs">
            <Phone className="h-3 w-3 text-muted-foreground" />
            {row.original.phone}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) =>
        row.original.email ? (
          <span className="flex items-center gap-1 text-xs">
            <Mail className="h-3 w-3 text-muted-foreground" />
            {row.original.email}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[row.original.status] ?? ""}`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "totalSavings",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Savings
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-green-600">
          {formatUGX(row.original.totalSavings ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: "totalLoans",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Loans
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-orange-600">
          {formatUGX(row.original.totalLoans ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: "joinedAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Joined
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.joinedAt ? formatDate(row.original.joinedAt) : "-"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original
        return (
          <div className="flex items-center h-full">
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push(`/members/${member.id}`)}>
                  <Eye className="mr-2 h-4 w-4" /> View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/members/${member.id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit Member
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/loans?member=${member.id}`)}>
                  <Banknote className="mr-2 h-4 w-4" /> Assign Loan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/savings?member=${member.id}`)}>
                  <PiggyBank className="mr-2 h-4 w-4" /> Add Savings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setMemberToDelete(member)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Remove Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: members,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const handleDelete = async () => {
    if (!memberToDelete) return
    setDeleting(true)
    if (isOffline()) {
      try {
        await offlineDeleteMember(db, memberToDelete.id)
        toast.success("Member removed (offline)")
      } catch {
        toast.error("Failed to delete offline")
      }
      setDeleting(false)
      setMemberToDelete(null)
      return
    }
    const res = await deleteMemberAction(memberToDelete.id)
    setDeleting(false)
    setMemberToDelete(null)
    if (res.success) toast.success("Member removed")
    else if (res.offline) {
      try {
        await offlineDeleteMember(db, memberToDelete.id)
        toast.success("Member removed (offline)")
      } catch {
        toast.error(res.error || "Failed to delete offline")
      }
    } else toast.error(res.error)
  }

  return (
    <>
      <AlertDialog
        open={!!memberToDelete}
        onOpenChange={(open) => { if (!open) setMemberToDelete(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {memberToDelete?.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this member and all their associated data
              including loans, savings, fines, and transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : "Yes, Delete Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                    No members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </div>
    </>
  )
}

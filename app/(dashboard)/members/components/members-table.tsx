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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  Banknote,
  PiggyBank,
} from "lucide-react"
import { formatDate } from "@/lib/utils/format"

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
}
import { deleteMemberAction } from "../actions"
import { toast } from "sonner"

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  suspended: "secondary",
  exited: "destructive",
}

interface MembersTableProps {
  members: Member[]
}

export function MembersTable({ members }: MembersTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "full_name",
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
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={row.original.photoUrl ?? ""} />
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
              {row.original.fullName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.original.fullName}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.memberCode}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "national_id",
      header: "National ID",
      cell: ({ row }) => row.original.nationalId ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "joined_at",
      header: "Joined",
      cell: ({ row }) => formatDate(row.original.joinedAt),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded-md p-1 hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/members/${row.original.id}`)
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/members/${row.original.id}/edit`)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Member
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/loans?member=${row.original.id}`)
              }}
            >
              <Banknote className="mr-2 h-4 w-4" />
              Assign Loan
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/savings?member=${row.original.id}`)
              }}
            >
              <PiggyBank className="mr-2 h-4 w-4" />
              Add Savings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={async (e) => {
                e.stopPropagation()
                const res = await deleteMemberAction(row.original.id)
                if (res.success) toast.success("Member removed")
                else toast.error(res.error)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
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
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-muted-foreground">
        <p className="text-lg font-medium">No members found</p>
        <p className="mt-1 text-sm">Add your first member to get started</p>
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
                onClick={() => router.push(`/members/${row.original.id}`)}
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
    </div>
  )
}

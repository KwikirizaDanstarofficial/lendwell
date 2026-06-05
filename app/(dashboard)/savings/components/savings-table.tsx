"use client"

import { useState } from "react"
import { usePowerSync } from "@powersync/react"
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
  ArrowUpDown,
  Lock,
  Unlock,
} from "lucide-react"
import { formatDate, formatUGX } from "@/lib/utils/format"

type Account = {
  id: string
  accountNumber: string
  balance: number
  accountType: string
  isLocked: boolean
  lockUntil: Date | null
  lockReason: string | null
  createdAt: Date | null
  updatedAt: Date | null
  memberId: string
  categoryId: string
  memberName: string
  memberCode: string
  memberPhone: string | null
  categoryName: string
}

type ActiveLoan = {
  id: string
  loan_ref: string
  balance: number
  member_id: string
}

export function SavingsTable({
  accounts,
  activeLoans,
}: {
  accounts: Account[]
  activeLoans: ActiveLoan[]
}) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])

  const activeLoanMap = new Map<string, number>()
  activeLoans.forEach((l) => {
    activeLoanMap.set(l.member_id, (activeLoanMap.get(l.member_id) ?? 0) + 1)
  })

  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: "accountNumber",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Account No
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.accountNumber}</span>
      ),
    },
    {
      id: "member",
      header: "Member",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-xs">{row.original.memberName}</p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {row.original.memberCode}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "balance",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Balance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-xs">
          {formatUGX(row.original.balance)}
        </span>
      ),
    },
    {
      accessorKey: "accountType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {row.original.accountType}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const acct = row.original
        const hasLoan = activeLoanMap.has(acct.memberId)
        return (
          <div className="flex gap-1">
            {acct.isLocked ? (
              <Badge variant="secondary" className="text-[10px]">
                Locked
              </Badge>
            ) : (
              <Badge variant="default" className="text-[10px]">
                Active
              </Badge>
            )}
            {hasLoan && (
              <Badge variant="outline" className="text-[10px] border-orange-300">
                Active Loan
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "lockUntil",
      header: "Lock Until",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.lockUntil ? formatDate(row.original.lockUntil) : "-"}
        </span>
      ),
    },
    {
      accessorKey: "categoryName",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.categoryName || "-"}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Opened
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.createdAt ? formatDate(row.original.createdAt) : "-"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/savings/${row.original.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {row.original.isLocked ? (
              <DropdownMenuItem>
                <Unlock className="mr-2 h-4 w-4" />
                Unlock
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>
                <Lock className="mr-2 h-4 w-4" />
                Lock
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
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

  return (
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
                  No savings accounts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}

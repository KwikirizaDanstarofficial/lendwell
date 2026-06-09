"use client"

import { useState, useCallback } from "react"
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
  Plus,
  Minus,
  Lock,
  Unlock,
  Scissors,
  Trash2,
  PiggyBank,
  ArrowUpDown,
  Loader2,
} from "lucide-react"
import { formatDate, formatUGX } from "@/lib/utils/format"
import { toast } from "sonner"
import { unlockAccountAction, deleteSavingsAccountAction } from "../actions"
import { DepositDialog } from "./deposit-dialog"
import { WithdrawDialog } from "./withdraw-dialog"
import { LockDialog } from "./lock-dialog"
import { TrimLoanDialog } from "./trim-loan-dialog"

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
  const [depositAccount, setDepositAccount] = useState<any>(null)
  const [withdrawAccount, setWithdrawAccount] = useState<any>(null)
  const [lockAccount, setLockAccount] = useState<any>(null)
  const [trimAccount, setTrimAccount] = useState<any>(null)
  const [deleteAccount, setDeleteAccount] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const activeLoanMap = new Map<string, number>()
  activeLoans.forEach((l) => {
    activeLoanMap.set(l.member_id, (activeLoanMap.get(l.member_id) ?? 0) + 1)
  })

  const handleUnlock = useCallback(async (id: string) => {
    const res = await unlockAccountAction(id)
    if (res.success) toast.success("Account unlocked")
    else toast.error(res.error)
  }, [])

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
        <Badge variant={row.original.accountType === "fixed" ? "default" : "outline"} className="capitalize text-xs">
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
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
              acct.isLocked
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            }`}>
              {acct.isLocked ? "Locked" : "Active"}
            </span>
            {hasLoan && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                Active Loan
              </span>
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
      cell: ({ row }) => {
        const account = row.original
        return (
          <div className="flex items-center h-full">
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => router.push(`/savings/${account.id}`)}>
                  <Eye className="mr-2 h-4 w-4" /> View Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-green-600" onClick={() => setDepositAccount(account)}>
                  <Plus className="mr-2 h-4 w-4" /> Deposit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-orange-600" onClick={() => setWithdrawAccount(account)}>
                  <Minus className="mr-2 h-4 w-4" /> Withdraw
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {account.isLocked ? (
                  <DropdownMenuItem onClick={() => handleUnlock(account.id)}>
                    <Unlock className="mr-2 h-4 w-4" /> Unlock Account
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setLockAccount(account)}>
                    <Lock className="mr-2 h-4 w-4" /> Lock Account
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setTrimAccount(account)}>
                  <Scissors className="mr-2 h-4 w-4" /> Trim Loan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteAccount(account)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
    if (!deleteAccount) return
    setDeleting(true)
    const res = await deleteSavingsAccountAction(deleteAccount.id)
    setDeleting(false)
    if (res.success) {
      toast.success("Account deleted")
      setDeleteAccount(null)
    } else {
      toast.error(res.error)
    }
  }

  return (
    <>
      <AlertDialog
        open={!!deleteAccount}
        onOpenChange={(open) => { if (!open) setDeleteAccount(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete account <strong>{deleteAccount?.accountNumber}</strong> and all its transaction history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : "Delete Account"}
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
                    No savings accounts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </div>

      {depositAccount && (
        <DepositDialog account={depositAccount} open={!!depositAccount} onClose={() => setDepositAccount(null)} />
      )}
      {withdrawAccount && (
        <WithdrawDialog account={withdrawAccount} open={!!withdrawAccount} onClose={() => setWithdrawAccount(null)} />
      )}
      {lockAccount && (
        <LockDialog account={lockAccount} open={!!lockAccount} onClose={() => setLockAccount(null)} />
      )}
      {trimAccount && (
        <TrimLoanDialog account={trimAccount} open={!!trimAccount} onClose={() => setTrimAccount(null)} loans={activeLoans} />
      )}
    </>
  )
}

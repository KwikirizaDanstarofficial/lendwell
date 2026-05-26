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
  ArrowUpDown,
  Plus,
  Minus,
  Lock,
  Unlock,
  Scissors,
  Eye,
  Trash2,
  PiggyBank,
} from "lucide-react"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { toast } from "sonner"
import { unlockAccountAction, deleteSavingsAccountAction } from "../actions"
import { DepositDialog } from "./deposit-dialog"
import { WithdrawDialog } from "./withdraw-dialog"
import { LockDialog } from "./lock-dialog"
import { TrimLoanDialog } from "./trim-loan-dialog"
import { AccountDetailDialog } from "./account-detail-dialog"

export function SavingsTable({
  accounts,
  activeLoans,
}: {
  accounts: any[]
  activeLoans: any[]
}) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [depositAccount, setDepositAccount] = useState<any>(null)
  const [withdrawAccount, setWithdrawAccount] = useState<any>(null)
  const [lockAccount, setLockAccount] = useState<any>(null)
  const [trimAccount, setTrimAccount] = useState<any>(null)
  const [deleteAccount, setDeleteAccount] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const handleUnlock = async (id: string) => {
    const res = await unlockAccountAction(id)
    if (res.success) toast.success("Account unlocked")
    else toast.error(res.error)
  }

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

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "accountNumber",
      header: "Account",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.accountNumber}</span>
      ),
    },
    {
      accessorKey: "memberName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Member
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.memberName}</p>
          <p className="font-mono text-xs text-muted-foreground">
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
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          {formatUGX(row.original.balance)}
        </span>
      ),
    },
    {
      accessorKey: "account_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant={row.original.accountType === "fixed" ? "default" : "outline"}
        >
          {row.original.accountType}
        </Badge>
      ),
    },
    {
      accessorKey: "category_name",
      header: "Category",
      cell: ({ row }) => row.original.category_name ?? "—",
    },
    {
      accessorKey: "is_locked",
      header: "Status",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <Badge
            variant={row.original.isLocked ? "destructive" : "default"}
            className="text-xs"
          >
            {row.original.isLocked ? (
              <>
                <Lock className="mr-1 h-3 w-3" />
                Locked
              </>
            ) : (
              <>
                <Unlock className="mr-1 h-3 w-3" />
                Active
              </>
            )}
          </Badge>
          {row.original.lockUntil && (
            <p className="text-xs text-muted-foreground">
              Until {formatDate(row.original.lockUntil)}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Opened",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const account = row.original
        const memberLoans = activeLoans.filter(
          (l) => l.memberId === account.memberId
        )

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/savings/${account.id}`)
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-green-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDepositAccount(account)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Deposit
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="text-orange-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    setWithdrawAccount(account)
                  }}
                  disabled={account.isLocked}
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Withdraw
                </DropdownMenuItem>

                {memberLoans.length > 0 && (
                  <DropdownMenuItem
                    className="text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTrimAccount(account)
                    }}
                    disabled={account.isLocked}
                  >
                    <Scissors className="mr-2 h-4 w-4" />
                    Trim to Loan
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {account.isLocked ? (
                  <DropdownMenuItem
                    className="text-green-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnlock(account.id)
                    }}
                  >
                    <Unlock className="mr-2 h-4 w-4" />
                    Unlock Account
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="text-orange-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLockAccount(account)
                    }}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Lock Account
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteAccount(account)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
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
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-muted-foreground">
        <PiggyBank className="mb-3 h-12 w-12 opacity-30" />
        <p className="text-lg font-medium">No savings accounts found</p>
        <p className="mt-1 text-sm">Create your first savings account</p>
      </div>
    )
  }

  return (
    <>
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
                onClick={() => router.push(`/savings/${row.original.id}`)}
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

      {/* Dialogs */}
      {depositAccount && (
        <DepositDialog
          account={depositAccount}
          open={!!depositAccount}
          onClose={() => setDepositAccount(null)}
        />
      )}
      {withdrawAccount && (
        <WithdrawDialog
          account={withdrawAccount}
          open={!!withdrawAccount}
          onClose={() => setWithdrawAccount(null)}
        />
      )}
      {lockAccount && (
        <LockDialog
          account={lockAccount}
          open={!!lockAccount}
          onClose={() => setLockAccount(null)}
        />
      )}
      {trimAccount && (
        <TrimLoanDialog
          account={trimAccount}
          loans={activeLoans.filter((l) => l.memberId === trimAccount.memberId)}
          open={!!trimAccount}
          onClose={() => setTrimAccount(null)}
        />
      )}
      <AlertDialog
        open={!!deleteAccount}
        onOpenChange={() => setDeleteAccount(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Savings Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete account{" "}
              <strong>{deleteAccount?.accountNumber}</strong>.
              {deleteAccount?.balance > 0 && (
                <span className="mt-1 block text-destructive">
                  This account has a balance of{" "}
                  {formatUGX(deleteAccount?.balance)}. You must withdraw all
                  funds first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || deleteAccount?.balance > 0}
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

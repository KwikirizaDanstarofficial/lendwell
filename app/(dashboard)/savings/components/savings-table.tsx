"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/providers/theme-provider"
import { AgGridReact } from "ag-grid-react"
import type { ColDef, ICellRendererParams, CellClickedEvent } from "ag-grid-community"
import { agLightTheme, agDarkTheme } from "@/lib/ag-grid-theme"
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
import { MoreHorizontal, Plus, Minus, Lock, Unlock, Scissors, Eye, Trash2, PiggyBank } from "lucide-react"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { toast } from "sonner"
import { unlockAccountAction, deleteSavingsAccountAction } from "../actions"
import { DepositDialog } from "./deposit-dialog"
import { WithdrawDialog } from "./withdraw-dialog"
import { LockDialog } from "./lock-dialog"
import { TrimLoanDialog } from "./trim-loan-dialog"
import { AccountDetailDialog } from "./account-detail-dialog"

// ── Cell Renderers ─────────────────────────────────────────────────────────

const AccountCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full">
    <span className="font-mono text-sm">{p.data.accountNumber}</span>
  </div>
)

const MemberCell = (p: ICellRendererParams) => (
  <div className="flex flex-col justify-center h-full">
    <p className="text-sm font-medium leading-tight">{p.data.memberName ?? p.data.member_name}</p>
    <p className="font-mono text-xs text-muted-foreground">{p.data.memberCode}</p>
  </div>
)

const BalanceCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full">
    <span className="text-sm font-semibold text-green-600">{formatUGX(p.value)}</span>
  </div>
)

const TypeCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full">
    <Badge variant={p.value === "fixed" ? "default" : "outline"} className="capitalize">
      {p.value}
    </Badge>
  </div>
)

const StatusCell = (p: ICellRendererParams) => {
  const { isLocked, lockUntil } = p.data
  return (
    <div className="flex flex-col justify-center h-full gap-0.5">
      <Badge variant={isLocked ? "destructive" : "default"} className="text-xs w-fit">
        {isLocked ? <><Lock className="mr-1 h-3 w-3" />Locked</> : <><Unlock className="mr-1 h-3 w-3" />Active</>}
      </Badge>
      {isLocked && lockUntil && (
        <p className="text-[10px] text-muted-foreground">{formatDate(lockUntil)}</p>
      )}
    </div>
  )
}

const TextCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full text-sm">{p.value ?? "—"}</div>
)

const DateCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full text-sm text-muted-foreground">
    {formatDate(p.value)}
  </div>
)

const SavingsActionsCell = (p: ICellRendererParams) => {
  const { router, setDepositAccount, setWithdrawAccount, setLockAccount, setTrimAccount, setDeleteAccount, handleUnlock } = p.context
  const account = p.data
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
}

// ── Column definitions ─────────────────────────────────────────────────────

const columnDefs: ColDef[] = [
  { headerName: "Account No", field: "accountNumber", cellRenderer: AccountCell, minWidth: 130, flex: 1 },
  { headerName: "Member", field: "memberName", cellRenderer: MemberCell, minWidth: 180, flex: 2 },
  { headerName: "Balance", field: "balance", cellRenderer: BalanceCell, minWidth: 140, flex: 1 },
  { headerName: "Type", field: "accountType", cellRenderer: TypeCell, minWidth: 100, flex: 1 },
  { headerName: "Category", field: "category_name", cellRenderer: TextCell, minWidth: 120, flex: 1 },
  { headerName: "Status", field: "isLocked", cellRenderer: StatusCell, minWidth: 110, flex: 1 },
  { headerName: "Opened", field: "createdAt", cellRenderer: DateCell, minWidth: 110, flex: 1 },
  {
    colId: "actions",
    headerName: "",
    cellRenderer: SavingsActionsCell,
    width: 60,
    sortable: false,
    resizable: false,
    pinned: "right",
  },
]

// ── Component ──────────────────────────────────────────────────────────────

export function SavingsTable({
  accounts,
  activeLoans,
}: {
  accounts: any[]
  activeLoans: any[]
}) {
  const { resolvedTheme } = useTheme()
  const router = useRouter()
  const [depositAccount, setDepositAccount] = useState<any>(null)
  const [withdrawAccount, setWithdrawAccount] = useState<any>(null)
  const [lockAccount, setLockAccount] = useState<any>(null)
  const [trimAccount, setTrimAccount] = useState<any>(null)
  const [deleteAccount, setDeleteAccount] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const theme = resolvedTheme === "dark" ? agDarkTheme : agLightTheme

  const handleUnlock = useCallback(async (id: string) => {
    const res = await unlockAccountAction(id)
    if (res.success) toast.success("Account unlocked")
    else toast.error(res.error)
  }, [])

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

  const context = useMemo(
    () => ({ router, setDepositAccount, setWithdrawAccount, setLockAccount, setTrimAccount, setDeleteAccount, handleUnlock, activeLoans }),
    [router, handleUnlock, activeLoans]
  )

  const onCellClicked = useCallback(
    (e: CellClickedEvent) => {
      if (e.column.getColId() === "actions") return
      router.push(`/savings/${e.data.id}`)
    },
    [router]
  )

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-muted-foreground">
        <PiggyBank className="mb-3 h-12 w-12 opacity-30" />
        <p className="text-lg font-medium">No savings accounts found</p>
        <p className="mt-1 text-sm">Create your first savings account to get started</p>
      </div>
    )
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
              {deleting ? "Deleting…" : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="overflow-hidden rounded-lg border">
        <AgGridReact
          rowData={accounts}
          columnDefs={columnDefs}
          theme={theme}
          context={context}
          domLayout="autoHeight"
          pagination
          paginationPageSize={20}
          suppressCellFocus
          onCellClicked={onCellClicked}
          rowClass="cursor-pointer"
          defaultColDef={{ resizable: true, sortable: true }}
        />
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

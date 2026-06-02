"use client"
"use client"

import { useMemo, useState, useCallback } from "react"
import { usePowerSync } from "@powersync/react"
import { offlineDeleteLoan, offlineApproveLoan, offlineDisburseLoan } from "@/lib/powersync/offline-mutations"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/providers/theme-provider"
import { AgGridReact } from "ag-grid-react"
import type { ColDef, ICellRendererParams, CellClickedEvent } from "ag-grid-community"
import { agLightTheme, agDarkTheme } from "@/lib/ag-grid-theme"
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
  Send,
  Eye,
  Banknote,
  Trash2,
  FileText,
  Plus,
  Loader2,
} from "lucide-react"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { toast } from "sonner"
import { approveLoanAction, disburseLoanAction, deleteLoanAction } from "../actions"
import { RepayDialog } from "./repay-dialog"
import { DeclineDialog } from "./decline-dialog"
import { TopUpDialog } from "./top-up-dialog"
import { LoanPdfButton } from "./loan-pdf-button"
import { isOffline } from "@/lib/utils/is-offline"

// ── Status badge helper ────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  disbursed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  settled: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  defaulted: "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300",
  extended: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
}

// ── Cell Renderers ─────────────────────────────────────────────────────────

const LoanRefCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full">
    <span className="font-mono text-sm">{p.data.loanRef}</span>
  </div>
)

const MemberCell = (p: ICellRendererParams) => (
  <div className="flex flex-col justify-center h-full">
    <p className="text-sm font-medium leading-tight">{p.data.memberName}</p>
    <p className="font-mono text-xs text-muted-foreground">{p.data.memberCode}</p>
  </div>
)

const AmountCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full text-sm">{formatUGX(p.value)}</div>
)

const StatusCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full">
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[p.value] ?? ""}`}>
      {p.value}
    </span>
  </div>
)

const DateCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full text-sm text-muted-foreground">
    {formatDate(p.value)}
  </div>
)

const LoanActionsCell = (p: ICellRendererParams) => {
  const { router, setRepayLoan, setDeclineLoan, setTopUpLoan, setDeleteLoan, db } = p.context
  const loan = p.data
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
          <DropdownMenuItem onClick={() => router.push(`/loans/${loan.id}`)}>
            <Eye className="mr-2 h-4 w-4" /> View Details / Timesheet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/loans/${loan.id}/contract`)}>
            <FileText className="mr-2 h-4 w-4" /> View Contract
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {loan.status === "pending" && (
            <>
              <DropdownMenuItem
                className="text-green-600"
                onClick={async () => {
                  if (isOffline()) {
                    await offlineApproveLoan(db, loan.id).catch(() => {})
                    toast.success("Loan approved offline — will sync when connected.")
                    return
                  }
                  const res = await approveLoanAction(loan.id)
                  if (res.success) toast.success("Loan approved & disbursed")
                  else if (res.offline) {
                    await offlineApproveLoan(db, loan.id).catch(() => {})
                    toast.success("Loan approved offline — will sync when connected.")
                  } else toast.error(res.error)
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Approve & Disburse
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => setDeclineLoan(loan)}>
                <XCircle className="mr-2 h-4 w-4" /> Decline Loan
              </DropdownMenuItem>
            </>
          )}
          {loan.status === "approved" && (
            <DropdownMenuItem
              className="text-purple-600"
              onClick={async () => {
                if (isOffline()) {
                  await offlineDisburseLoan(db, loan.id).catch(() => {})
                  toast.success("Loan disbursed offline — will sync when connected.")
                  return
                }
                const res = await disburseLoanAction(loan.id)
                if (res.success) toast.success("Loan disbursed")
                else toast.error(res.error)
              }}
            >
              <Send className="mr-2 h-4 w-4" /> Disburse Loan
            </DropdownMenuItem>
          )}
          {(loan.status === "active" || loan.status === "disbursed") && (
            <>
              <DropdownMenuItem className="text-blue-600" onClick={() => setRepayLoan(loan)}>
                <Banknote className="mr-2 h-4 w-4" /> Record Repayment
              </DropdownMenuItem>
              <DropdownMenuItem className="text-green-600" onClick={() => setTopUpLoan(loan)}>
                <Plus className="mr-2 h-4 w-4" /> Top Up Loan
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <LoanPdfButton loan={loan} />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteLoan(loan)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Loan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ── Column definitions ─────────────────────────────────────────────────────

const columnDefs: ColDef[] = [
  { headerName: "Loan Ref", field: "loanRef", cellRenderer: LoanRefCell, minWidth: 110, flex: 1 },
  { headerName: "Member", field: "memberName", cellRenderer: MemberCell, minWidth: 180, flex: 2 },
  { headerName: "Amount", field: "amount", cellRenderer: AmountCell, minWidth: 130, flex: 1 },
  { headerName: "Expected", field: "expectedReceived", cellRenderer: AmountCell, minWidth: 130, flex: 1 },
  { headerName: "Balance", field: "balance", cellRenderer: AmountCell, minWidth: 130, flex: 1 },
  { headerName: "Monthly", field: "monthlyPayment", cellRenderer: AmountCell, minWidth: 120, flex: 1 },
  { headerName: "Status", field: "status", cellRenderer: StatusCell, minWidth: 110, flex: 1 },
  { headerName: "Due Date", field: "dueDate", cellRenderer: DateCell, minWidth: 110, flex: 1 },
  { headerName: "Applied", field: "createdAt", cellRenderer: DateCell, minWidth: 110, flex: 1 },
  {
    colId: "actions",
    headerName: "",
    cellRenderer: LoanActionsCell,
    width: 60,
    sortable: false,
    resizable: false,
    pinned: "right",
  },
]

// ── Component ──────────────────────────────────────────────────────────────

export function LoansTable({ loans }: { loans: any[] }) {
  const { resolvedTheme } = useTheme()
  const router = useRouter()
  const [repayLoan, setRepayLoan] = useState<any>(null)
  const [declineLoan, setDeclineLoan] = useState<any>(null)
  const [topUpLoan, setTopUpLoan] = useState<any>(null)
  const [deleteLoan, setDeleteLoan] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const theme = resolvedTheme === "dark" ? agDarkTheme : agLightTheme

  const db = usePowerSync()

  const context = useMemo(
    () => ({ router, setRepayLoan, setDeclineLoan, setTopUpLoan, setDeleteLoan, db }),
    [router, db]
  )

  const handleDeleteLoan = async () => {
    if (!deleteLoan) return
    setDeleting(true)
    if (isOffline()) {
      await offlineDeleteLoan(db, deleteLoan.id).catch(() => {})
      setDeleting(false)
      setDeleteLoan(null)
      toast.success("Loan deleted offline — will sync when connected.")
      return
    }
    const res = await deleteLoanAction(deleteLoan.id)
    setDeleting(false)
    setDeleteLoan(null)
    if (res.success) toast.success("Loan deleted")
    else toast.error(res.error)
  }

  const onCellClicked = useCallback(
    (e: CellClickedEvent) => {
      if (e.column.getColId() === "actions") return
      router.push(`/loans/${e.data.id}`)
    },
    [router]
  )

  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-muted-foreground">
        <Banknote className="mb-3 h-12 w-12 opacity-30" />
        <p className="text-lg font-medium">No loans found</p>
        <p className="mt-1 text-sm">Add your first loan to get started</p>
      </div>
    )
  }

  return (
    <>
      <AlertDialog open={!!deleteLoan} onOpenChange={(open) => { if (!open) setDeleteLoan(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loan {deleteLoan?.loanRef}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this loan and all its repayment history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLoan}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : "Yes, Delete Loan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="overflow-hidden rounded-lg border">
        <AgGridReact
          rowData={loans}
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

      {repayLoan && (
        <RepayDialog loan={repayLoan} open={!!repayLoan} onClose={() => setRepayLoan(null)} />
      )}
      {declineLoan && (
        <DeclineDialog loan={declineLoan} open={!!declineLoan} onClose={() => setDeclineLoan(null)} />
      )}
      {topUpLoan && (
        <TopUpDialog loan={topUpLoan} open={!!topUpLoan} onClose={() => setTopUpLoan(null)} />
      )}
    </>
  )
}

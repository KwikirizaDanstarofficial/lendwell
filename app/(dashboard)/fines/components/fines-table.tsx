"use client"

import { useMemo, useState } from "react"
import { usePowerSync } from "@powersync/react"
import { offlineDeleteFine } from "@/lib/powersync/offline-mutations"
import { useTheme } from "@/components/providers/theme-provider"
import { AgGridReact } from "ag-grid-react"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
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
import { MoreHorizontal, CheckCircle, XCircle, Trash2, AlertCircle } from "lucide-react"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { toast } from "sonner"
import { deleteFineAction } from "../actions"
import { PayFineDialog } from "./pay-fine-dialog"
import { WaiveFineDialog } from "./waive-fine-dialog"
import { priorityColors, statusConfig } from "./fines-client"

// ── Cell Renderers ─────────────────────────────────────────────────────────

const RefCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full">
    <span className="font-mono text-sm">{p.data.fineRef ?? "—"}</span>
  </div>
)

const MemberCell = (p: ICellRendererParams) => (
  <div className="flex flex-col justify-center h-full">
    <p className="text-sm font-medium leading-tight">{p.data.member_name}</p>
    <p className="font-mono text-xs text-muted-foreground">{p.data.memberCode}</p>
  </div>
)

const AmountCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full">
    <span className="text-sm font-semibold text-red-600">{formatUGX(p.value)}</span>
  </div>
)

const PriorityCell = (p: ICellRendererParams) => {
  const priority = p.value ?? "normal"
  const style = priorityColors[priority] ?? priorityColors.normal
  return (
    <div className="flex items-center h-full">
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${style}`}>
        {priority}
      </span>
    </div>
  )
}

const StatusCell = (p: ICellRendererParams) => {
  const cfg = statusConfig[p.value] ?? statusConfig.pending
  const variantMap: Record<string, "default" | "outline" | "secondary"> = {
    paid: "default",
    waived: "outline",
    pending: "secondary",
  }
  return (
    <div className="flex items-center h-full">
      <Badge variant={variantMap[p.value] ?? "secondary"}>{cfg.label}</Badge>
    </div>
  )
}

const DateCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full text-sm text-muted-foreground">
    {formatDate(p.value)}
  </div>
)

const TextCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full text-sm">{p.value ?? "—"}</div>
)

const FineActionsCell = (p: ICellRendererParams) => {
  const { setPayFine, setWaiveFine, setDeleteFine } = p.context
  const fine = p.data
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
          {fine.status === "pending" && (
            <>
              <DropdownMenuItem className="text-green-600" onClick={() => setPayFine(fine)}>
                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
              </DropdownMenuItem>
              <DropdownMenuItem className="text-blue-600" onClick={() => setWaiveFine(fine)}>
                <XCircle className="mr-2 h-4 w-4" /> Waive Fine
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteFine(fine)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Fine
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ── Column definitions ─────────────────────────────────────────────────────

const columnDefs: ColDef[] = [
  { headerName: "Ref", field: "fineRef", cellRenderer: RefCell, minWidth: 110, flex: 1 },
  { headerName: "Member", field: "member_name", cellRenderer: MemberCell, minWidth: 180, flex: 2 },
  { headerName: "Category", field: "category_name", cellRenderer: TextCell, minWidth: 130, flex: 1 },
  { headerName: "Amount", field: "amount", cellRenderer: AmountCell, minWidth: 130, flex: 1 },
  { headerName: "Reason", field: "reason", cellRenderer: TextCell, minWidth: 160, flex: 2 },
  { headerName: "Priority", field: "priority", cellRenderer: PriorityCell, minWidth: 110, flex: 1 },
  { headerName: "Status", field: "status", cellRenderer: StatusCell, minWidth: 100, flex: 1 },
  { headerName: "Due", field: "dueDate", cellRenderer: DateCell, minWidth: 110, flex: 1 },
  { headerName: "Issued", field: "createdAt", cellRenderer: DateCell, minWidth: 110, flex: 1 },
  {
    colId: "actions",
    headerName: "",
    cellRenderer: FineActionsCell,
    width: 60,
    sortable: false,
    resizable: false,
    pinned: "right",
  },
]

// ── Component ──────────────────────────────────────────────────────────────

export function FinesTable({ fines }: { fines: any[] }) {
  const { resolvedTheme } = useTheme()
  const [payFine, setPayFine] = useState<any>(null)
  const [waiveFine, setWaiveFine] = useState<any>(null)
  const [deleteFine, setDeleteFine] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const theme = resolvedTheme === "dark" ? agDarkTheme : agLightTheme

  const db = usePowerSync()

  const handleDelete = async () => {
    if (!deleteFine) return
    setDeleting(true)
    if (!navigator.onLine) {
      await offlineDeleteFine(db, deleteFine.id).catch(() => {})
      setDeleting(false)
      toast.success("Fine deleted offline — will sync when connected.")
      setDeleteFine(null)
      return
    }
    const res = await deleteFineAction(deleteFine.id)
    setDeleting(false)
    if (res.success) {
      toast.success("Fine deleted")
      setDeleteFine(null)
    } else {
      toast.error(res.error)
    }
  }

  const context = useMemo(
    () => ({ setPayFine, setWaiveFine, setDeleteFine }),
    []
  )

  if (fines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-muted-foreground">
        <AlertCircle className="mb-3 h-12 w-12 opacity-30" />
        <p className="text-lg font-medium">No fines found</p>
        <p className="mt-1 text-sm">Issue a fine to get started</p>
      </div>
    )
  }

  return (
    <>
      <AlertDialog
        open={!!deleteFine}
        onOpenChange={(open) => { if (!open) setDeleteFine(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fine?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this fine record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete Fine"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="overflow-hidden rounded-lg border">
        <AgGridReact
          rowData={fines}
          columnDefs={columnDefs}
          theme={theme}
          context={context}
          domLayout="autoHeight"
          pagination
          paginationPageSize={20}
          suppressCellFocus
          defaultColDef={{ resizable: true, sortable: true }}
        />
      </div>

      {payFine && (
        <PayFineDialog fine={payFine} open={!!payFine} onClose={() => setPayFine(null)} />
      )}
      {waiveFine && (
        <WaiveFineDialog fine={waiveFine} open={!!waiveFine} onClose={() => setWaiveFine(null)} />
      )}
    </>
  )
}

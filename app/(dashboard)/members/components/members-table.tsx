"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/providers/theme-provider"
import { AgGridReact } from "ag-grid-react"
import type { ColDef, ICellRendererParams, CellClickedEvent } from "ag-grid-community"
import { agLightTheme, agDarkTheme } from "@/lib/ag-grid-theme"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { MoreHorizontal, Eye, Pencil, Trash2, Banknote, PiggyBank, Loader2 } from "lucide-react"
import { formatDate, formatUGX } from "@/lib/utils/format"
import { deleteMemberAction } from "../actions"
import { toast } from "sonner"

// ── Cell Renderers (defined at module level for stable references) ──────────

const MemberCell = (p: ICellRendererParams) => {
  const { fullName, memberCode, photoUrl } = p.data
  const initials = (fullName as string).slice(0, 2).toUpperCase()
  return (
    <div className="flex items-center gap-3 h-full">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={photoUrl ?? ""} />
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium leading-tight">{fullName}</p>
        <p className="font-mono text-xs text-muted-foreground">{memberCode}</p>
      </div>
    </div>
  )
}

const StatusCell = (p: ICellRendererParams) => {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    suspended: "secondary",
    exited: "destructive",
  }
  return (
    <div className="flex items-center h-full">
      <Badge variant={map[p.value] ?? "secondary"} className="capitalize">
        {p.value}
      </Badge>
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

const SavingsCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full gap-1.5 text-sm font-medium text-green-600">
    <PiggyBank className="h-3.5 w-3.5 shrink-0" />
    {formatUGX(p.value ?? 0)}
  </div>
)

const LoansCell = (p: ICellRendererParams) => (
  <div className="flex items-center h-full gap-1.5 text-sm font-medium text-blue-600">
    <Banknote className="h-3.5 w-3.5 shrink-0" />
    {formatUGX(p.value ?? 0)}
  </div>
)

const MemberActionsCell = (p: ICellRendererParams) => {
  const { router, setMemberToDelete } = p.context
  const member = p.data
  return (
    <div className="flex items-center h-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
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
}

// ── Column definitions (stable, module-level) ─────────────────────────────

const columnDefs: ColDef[] = [
  {
    headerName: "Member",
    field: "fullName",
    cellRenderer: MemberCell,
    minWidth: 220,
    flex: 2,
    sortable: true,
  },
  {
    headerName: "Phone",
    field: "phone",
    cellRenderer: TextCell,
    flex: 1,
    minWidth: 130,
  },
  {
    headerName: "National ID",
    field: "nationalId",
    cellRenderer: TextCell,
    flex: 1,
    minWidth: 130,
  },
  {
    headerName: "Status",
    field: "status",
    cellRenderer: StatusCell,
    flex: 1,
    minWidth: 110,
  },
  {
    headerName: "Joined",
    field: "joinedAt",
    cellRenderer: DateCell,
    flex: 1,
    minWidth: 120,
  },
  {
    headerName: "Savings",
    field: "totalSavings",
    cellRenderer: SavingsCell,
    flex: 1,
    minWidth: 140,
  },
  {
    headerName: "Active Loans",
    field: "totalLoans",
    cellRenderer: LoansCell,
    flex: 1,
    minWidth: 140,
  },
  {
    colId: "actions",
    headerName: "",
    cellRenderer: MemberActionsCell,
    width: 60,
    sortable: false,
    resizable: false,
    pinned: "right",
  },
]

// ── Component ─────────────────────────────────────────────────────────────

type Member = {
  id: string
  memberCode: string
  fullName: string
  phone: string | null
  nationalId: string | null
  photoUrl: string | null
  status: "active" | "suspended" | "exited"
  joinedAt: Date | null
  totalSavings?: number
  totalLoans?: number
}

export function MembersTable({ members }: { members: Member[] }) {
  const { resolvedTheme } = useTheme()
  const router = useRouter()
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)
  const [deleting, setDeleting] = useState(false)

  const theme = resolvedTheme === "dark" ? agDarkTheme : agLightTheme

  const context = useMemo(() => ({ router, setMemberToDelete }), [router])

  const onCellClicked = useCallback(
    (e: CellClickedEvent) => {
      if (e.column.getColId() === "actions") return
      router.push(`/members/${e.data.id}`)
    },
    [router]
  )

  const handleDelete = async () => {
    if (!memberToDelete) return
    setDeleting(true)
    const res = await deleteMemberAction(memberToDelete.id)
    setDeleting(false)
    setMemberToDelete(null)
    if (res.success) toast.success("Member removed")
    else toast.error(res.error)
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-muted-foreground">
        <p className="text-lg font-medium">No members found</p>
        <p className="mt-1 text-sm">Add your first member to get started</p>
      </div>
    )
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

      <div className="overflow-hidden rounded-lg border">
        <AgGridReact
          rowData={members}
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
    </>
  )
}

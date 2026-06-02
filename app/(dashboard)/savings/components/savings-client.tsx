// app/(dashboard)/savings/components/savings-client.tsx
// Top-level client shell for the Savings page.
// Manages search filtering, Excel export, and the create-account dialog.
"use client"

import { useState, useMemo, useEffect } from "react"
import { useQuery } from "@powersync/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Download } from "lucide-react"
import { SavingsTable } from "./savings-table"
import { CreateAccountDialog } from "./create-account-dialog"
import { getMembersForSavings, getSavingsCategoriesForSelect } from "../actions"
import ExcelJS from "exceljs"
import { toast } from "sonner"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Divisor to convert stored cent amounts to UGX for the Excel export. */
const CENTS_PER_UNIT = 100

/** Filename used when downloading the savings export. */
const EXPORT_FILENAME = "sacco-savings.xlsx"

/** MIME type for .xlsx blobs. */
const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

/** Column definitions for the Excel export. */
const EXPORT_COLUMNS = [
  { header: "Account No",    key: "account_no",  width: 15 },
  { header: "Member",        key: "member",       width: 25 },
  { header: "Member Code",   key: "member_code",  width: 15 },
  { header: "Balance (UGX)", key: "balance",      width: 15 },
  { header: "Type",          key: "type",         width: 10 },
  { header: "Status",        key: "status",       width: 10 },
  { header: "Lock Until",    key: "lock_until",   width: 15 },
  { header: "Category",      key: "category",     width: 15 },
  { header: "Opened",        key: "opened",       width: 15 },
] as const

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavingsClientProps {
  saccoId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SavingsClient({ saccoId }: SavingsClientProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [search,     setSearch]     = useState("")

  // Server-side fallback data for when local SQLite is not yet populated.
  const [serverMembers,    setServerMembers]    = useState<any[]>([])
  const [serverCategories, setServerCategories] = useState<any[]>([])

  const { data: accountRows = [] } = useQuery(
    `SELECT s.id, s.account_number, s.balance, s.account_type, s.is_locked,
            s.lock_until, s.lock_reason, s.created_at, s.updated_at,
            s.member_id, s.category_id,
            m.full_name AS member_name, m.member_code, m.phone AS member_phone,
            c.name AS category_name
     FROM savings_accounts s
     LEFT JOIN members m ON m.id = s.member_id
     LEFT JOIN savings_categories c ON c.id = s.category_id
     WHERE s.sacco_id = ?
     ORDER BY s.balance DESC`,
    [saccoId]
  )

  const { data: memberRows = [] } = useQuery(
    "SELECT id, full_name, member_code, phone FROM members WHERE sacco_id = ? ORDER BY full_name ASC",
    [saccoId]
  )

  const { data: categoryRows = [] } = useQuery(
    "SELECT id, name, description, interest_rate, is_fixed FROM savings_categories WHERE sacco_id = ? AND is_active = 1",
    [saccoId]
  )

  const { data: activeLoanRows = [] } = useQuery(
    "SELECT id, loan_ref, balance, member_id FROM loans WHERE sacco_id = ? AND status = 'active'",
    [saccoId]
  )

  // When local SQLite has no members/categories yet, fetch from the server directly.
  useEffect(() => {
    if ((memberRows as any[]).length === 0) {
      getMembersForSavings().then(setServerMembers).catch((err) => {
        console.error("[Savings] Failed to fetch members from server:", err)
        toast.error("Failed to load members — check your connection")
      })
    }
  }, [(memberRows as any[]).length])

  useEffect(() => {
    if ((categoryRows as any[]).length === 0) {
      getSavingsCategoriesForSelect().then(setServerCategories).catch((err) => {
        console.error("[Savings] Failed to fetch categories from server:", err)
        toast.error("Failed to load categories — check your connection")
      })
    }
  }, [(categoryRows as any[]).length])

  const accounts = useMemo(() => (accountRows as any[]).map((r) => ({
    id:           r.id,
    accountNumber: r.account_number,
    balance:      Number(r.balance),
    accountType:  r.account_type,
    isLocked:     Boolean(r.is_locked),
    lockUntil:    r.lock_until ? new Date(r.lock_until) : null,
    lockReason:   r.lock_reason ?? null,
    createdAt:    r.created_at ? new Date(r.created_at) : null,
    updatedAt:    r.updated_at ? new Date(r.updated_at) : null,
    memberId:     r.member_id,
    categoryId:   r.category_id,
    memberName:   r.member_name ?? "",
    memberCode:   r.member_code ?? "",
    memberPhone:  r.member_phone ?? null,
    categoryName: r.category_name ?? "",
  })), [accountRows])

  const members = useMemo(() => {
    const local = (memberRows as any[])
    if (local.length > 0) {
      return local.map((r) => ({ id: r.id, fullName: r.full_name, memberCode: r.member_code, phone: r.phone }))
    }
    // Fall back to server-fetched data when local SQLite is empty
    return serverMembers.map((m) => ({ id: m.id, fullName: m.full_name, memberCode: m.member_code, phone: m.phone }))
  }, [memberRows, serverMembers])

  const categories = useMemo(() => {
    const local = (categoryRows as any[])
    if (local.length > 0) {
      return local.map((r) => ({ id: r.id, name: r.name, description: r.description, interestRate: r.interest_rate, isFixed: Boolean(r.is_fixed) }))
    }
    // Fall back to server-fetched data when local SQLite is empty
    return serverCategories.map((c) => ({ id: c.id, name: c.name, description: c.description, interestRate: c.interestRate, isFixed: Boolean(c.isFixed) }))
  }, [categoryRows, serverCategories])

  const activeLoans = useMemo(() => (activeLoanRows as any[]).map((r) => ({
    id: r.id, loan_ref: r.loan_ref, balance: Number(r.balance), member_id: r.member_id,
  })), [activeLoanRows])

  const stats = useMemo(() => {
    const totalBalance    = accounts.reduce((s, a) => s + a.balance, 0)
    const totalAccounts   = accounts.length
    const lockedAccounts  = accounts.filter((a) => a.isLocked).length
    const fixedAccounts   = accounts.filter((a) => a.accountType === "fixed").length
    const regularAccounts = totalAccounts - fixedAccounts
    const avgBalance      = totalAccounts > 0 ? totalBalance / totalAccounts : 0
    return { totalBalance, totalAccounts, lockedAccounts, regularAccounts, fixedAccounts, avgBalance }
  }, [accounts])

  // Filter accounts by member name, account number, or member code
  const filteredAccounts = useMemo(() => {
    if (!accounts || !Array.isArray(accounts)) return []
    return accounts.filter(
      (a) =>
        a?.memberName?.toLowerCase().includes(search.toLowerCase())     ||
        a?.accountNumber?.toLowerCase().includes(search.toLowerCase()) ||
        a?.memberCode?.toLowerCase().includes(search.toLowerCase())
    )
  }, [accounts, search])

  /** Export the currently filtered accounts to an Excel file. */
  const handleExport = async () => {
    const workbook  = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Savings")

    worksheet.columns = EXPORT_COLUMNS as any

    worksheet.addRows(
      filteredAccounts.map((a) => ({
        account_no:  a.accountNumber,
        member:      a.memberName,
        member_code: a.memberCode,
        balance:     a.balance / CENTS_PER_UNIT,
        type:        a.accountType,
        status:      a.isLocked ? "Locked" : "Active",
        lock_until:  a.lockUntil ?? "",
        category:    a.categoryName ?? "",
        opened:      a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "",
      }))
    )

    const buffer = await workbook.xlsx.writeBuffer()
    const blob   = new Blob([buffer], { type: XLSX_MIME_TYPE })
    const url    = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href     = url
    anchor.download = EXPORT_FILENAME
    anchor.click()
    window.URL.revokeObjectURL(url)

    toast.success("Savings exported to Excel")
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Savings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats?.totalAccounts ?? 0} savings accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Button>
        </div>
      </div>

      {/* Toolbar: result count + search */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="shrink-0 text-sm text-muted-foreground">
          {filteredAccounts.length} of {accounts.length} accounts
        </p>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search member, account number..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <SavingsTable accounts={filteredAccounts} activeLoans={activeLoans} />

      <CreateAccountDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        members={members}
        categories={categories}
        saccoId={saccoId}
      />
    </div>
  )
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED COMPONENTS:
//   SavingsClient({ accounts, stats, members, categories, activeLoans })
//     – client shell for the /savings page
//     – handles search filtering, Excel export, and the create-account dialog
//
// KEY CONSTANTS:
//   CENTS_PER_UNIT   = 100  (divide stored amounts before writing to Excel)
//   EXPORT_FILENAME  = "sacco-savings.xlsx"
//   EXPORT_COLUMNS   – column definitions for the Excel export
//
// RELATED COMPONENTS:
//   SavingsTable          – renders the filtered accounts list
//   CreateAccountDialog   – dialog for creating a new savings account

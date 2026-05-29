// app/(dashboard)/savings/components/savings-client.tsx
// Top-level client shell for the Savings page.
// Manages search filtering, Excel export, and the create-account dialog.
"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Download } from "lucide-react"
import { SavingsTable } from "./savings-table"
import { CreateAccountDialog } from "./create-account-dialog"
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
  accounts:    any[]
  stats: {
    totalBalance:    number
    totalAccounts:   number
    lockedAccounts:  number
    regularAccounts: number
    fixedAccounts:   number
    avgBalance:      number
  }
  members:     any[]
  categories:  any[]
  activeLoans: any[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SavingsClient({
  accounts,
  stats,
  members,
  categories,
  activeLoans,
}: SavingsClientProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [search,     setSearch]     = useState("")

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
        member:      a.member_name,
        member_code: a.memberCode,
        balance:     a.balance / CENTS_PER_UNIT,
        type:        a.accountType,
        status:      a.isLocked ? "Locked" : "Active",
        lock_until:  a.lockUntil ?? "",
        category:    a.category_name ?? "",
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

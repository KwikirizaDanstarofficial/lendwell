// app/(dashboard)/members/components/members-client.tsx
// Top-level client shell for the Members page.
// Manages view mode (table/grid), search filtering, Excel export,
// and the import dialog.
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@powersync/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Upload, UserPlus, LayoutGrid, List, Search } from "lucide-react"
import { MembersTable } from "./members-table"
import { MembersGrid } from "./members-grid"
import { ImportExcel } from "./import-excel"
import ExcelJS from "exceljs"
import { toast } from "sonner"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default view mode when the page first renders. */
const DEFAULT_VIEW = "table" as const

/** Filename used when exporting the members list to Excel. */
const EXPORT_FILENAME = "sacco-members.xlsx"

/** Excel worksheet name for the members export. */
const EXPORT_SHEET_NAME = "Members"

/** MIME type for .xlsx files used in the download blob. */
const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

/** Column definitions for the Excel export. */
const EXPORT_COLUMNS = [
  { header: "Member Code",       key: "member_code",    width: 15 },
  { header: "Full Name",         key: "full_name",       width: 25 },
  { header: "Email",             key: "email",           width: 30 },
  { header: "Phone",             key: "phone",           width: 15 },
  { header: "National ID",       key: "national_id",     width: 15 },
  { header: "Status",            key: "status",          width: 10 },
  { header: "Date of Birth",     key: "date_of_birth",   width: 15 },
  { header: "Address",           key: "address",         width: 30 },
  { header: "Next of Kin",       key: "next_of_kin",     width: 20 },
  { header: "Next of Kin Phone", key: "next_of_kin_phone", width: 15 },
  { header: "Joined At",         key: "joined_at",       width: 15 },
] as const

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "table" | "grid"

type Member = {
  id:                      string
  saccoId:                 string
  memberCode:              string
  fullName:                string
  email:                   string | null
  phone:                   string | null
  nationalId:              string | null
  photoUrl:                string | null
  dateOfBirth:             Date   | null
  address:                 string | null
  nextOfKin:               string | null
  nextOfKinPhone:          string | null
  nextOfKinRelationship:   string | null
  nextOfKinAddress:        string | null
  status:                  "active" | "suspended" | "exited"
  joinedAt:                Date | null
  createdAt:               Date | null
  updatedAt:               Date | null
  totalSavings?:           number
  totalLoans?:             number
}

interface MembersClientProps {
  saccoId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MembersClient({ saccoId }: MembersClientProps) {
  const router = useRouter()
  const [view,       setView]       = useState<ViewMode>(DEFAULT_VIEW)
  const [search,     setSearch]     = useState("")
  const [showImport, setShowImport] = useState(false)

  const { data: rows = [] } = useQuery(
    `SELECT m.id, m.sacco_id, m.member_code, m.full_name, m.email, m.phone,
            m.national_id, m.photo_url, m.date_of_birth, m.address,
            m.next_of_kin, m.next_of_kin_phone, m.next_of_kin_relationship,
            m.next_of_kin_address, m.status, m.joined_at, m.created_at, m.updated_at,
            COALESCE((SELECT SUM(s.balance) FROM savings_accounts s WHERE s.member_id = m.id AND s.sacco_id = ?), 0) AS total_savings,
            COALESCE((SELECT SUM(l.balance) FROM loans l WHERE l.member_id = m.id AND l.sacco_id = ? AND l.status IN ('active','disbursed')), 0) AS total_loans
     FROM members m WHERE m.sacco_id = ? ORDER BY m.created_at ASC`,
    [saccoId, saccoId, saccoId]
  )

  const members: Member[] = useMemo(() => (rows as any[]).map((r) => ({
    id:                    r.id,
    saccoId:               r.sacco_id,
    memberCode:            r.member_code ?? "",
    fullName:              r.full_name ?? "",
    email:                 r.email ?? null,
    phone:                 r.phone ?? null,
    nationalId:            r.national_id ?? null,
    photoUrl:              r.photo_url ?? null,
    dateOfBirth:           r.date_of_birth ? new Date(r.date_of_birth) : null,
    address:               r.address ?? null,
    nextOfKin:             r.next_of_kin ?? null,
    nextOfKinPhone:        r.next_of_kin_phone ?? null,
    nextOfKinRelationship: r.next_of_kin_relationship ?? null,
    nextOfKinAddress:      r.next_of_kin_address ?? null,
    status:                (r.status ?? "active") as Member["status"],
    joinedAt:              r.joined_at ? new Date(r.joined_at) : null,
    createdAt:             r.created_at ? new Date(r.created_at) : null,
    updatedAt:             r.updated_at ? new Date(r.updated_at) : null,
    totalSavings:          Number(r.total_savings ?? 0),
    totalLoans:            Number(r.total_loans ?? 0),
  })), [rows])

  // Filter members by name, code, or phone as the user types
  const filteredMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          m.fullName.toLowerCase().includes(search.toLowerCase())    ||
          m.memberCode.toLowerCase().includes(search.toLowerCase())  ||
          (m.phone ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [members, search]
  )

  /** Export the currently filtered member list to an Excel file. */
  const handleExport = async () => {
    const workbook  = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(EXPORT_SHEET_NAME)

    worksheet.columns = EXPORT_COLUMNS as any

    worksheet.addRows(
      filteredMembers.map((m) => ({
        member_code:    m.memberCode,
        full_name:      m.fullName,
        email:          m.email          ?? "",
        phone:          m.phone          ?? "",
        national_id:    m.nationalId     ?? "",
        status:         m.status,
        date_of_birth:  m.dateOfBirth    ?? "",
        address:        m.address        ?? "",
        next_of_kin:    m.nextOfKin      ?? "",
        next_of_kin_phone: m.nextOfKinPhone ?? "",
        joined_at:      m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "",
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

    toast.success("Members exported to Excel")
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {members.length} total members
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="lg" onClick={() => setShowImport(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Excel
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button size="lg" onClick={() => router.push("/members/add")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Toolbar: view toggle + search */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="table">
              <List className="mr-2 h-4 w-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="grid">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Cards
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, code, phone..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content: table or card grid */}
      {view === "table" ? (
        <MembersTable members={filteredMembers} />
      ) : (
        <MembersGrid members={filteredMembers} />
      )}

      {/* Import dialog */}
      <ImportExcel open={showImport} onClose={() => setShowImport(false)} />
    </div>
  )
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED COMPONENTS:
//   MembersClient({ members })
//     – client shell for the /members page
//     – controls view mode, search, Excel export, and import dialog
//
// KEY CONSTANTS:
//   DEFAULT_VIEW     = "table"
//   EXPORT_FILENAME  = "sacco-members.xlsx"
//   EXPORT_COLUMNS   – column definitions for the Excel export
//   XLSX_MIME_TYPE   – MIME type for .xlsx blobs
//
// RELATED COMPONENTS:
//   MembersTable      – tabular member list
//   MembersGrid       – card grid member list
//   ImportExcel       – bulk Excel import dialog

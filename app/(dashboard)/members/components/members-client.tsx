"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Download,
  Upload,
  UserPlus,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import { MembersTable } from "./members-table"

type Member = {
  id: string
  saccoId: string
  memberCode: string
  fullName: string
  email: string | null
  phone: string | null
  nationalId: string | null
  photoUrl: string | null
  dateOfBirth: Date | null
  address: string | null
  nextOfKin: string | null
  nextOfKinPhone: string | null
  nextOfKinRelationship: string | null
  nextOfKinAddress: string | null
  status: "active" | "suspended" | "exited"
  joinedAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
}
import { MembersGrid } from "./members-grid"
import { ImportExcel } from "./import-excel"
import ExcelJS from "exceljs"
import { toast } from "sonner"

interface MembersClientProps {
  members: Member[]
}

export function MembersClient({ members }: MembersClientProps) {
  const router = useRouter()
  const [view, setView] = useState<"table" | "grid">("table")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showImport, setShowImport] = useState(false)

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.fullName.toLowerCase().includes(search.toLowerCase()) ||
        m.memberCode.toLowerCase().includes(search.toLowerCase()) ||
        (m.phone ?? "").toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || m.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [members, search, statusFilter])

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Members")

    worksheet.columns = [
      { header: "Member Code", key: "member_code", width: 15 },
      { header: "Full Name", key: "full_name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "National ID", key: "national_id", width: 15 },
      { header: "Status", key: "status", width: 10 },
      { header: "Date of Birth", key: "date_of_birth", width: 15 },
      { header: "Address", key: "address", width: 30 },
      { header: "Next of Kin", key: "next_of_kin", width: 20 },
      { header: "Next of Kin Phone", key: "next_of_kin_phone", width: 15 },
      { header: "Joined At", key: "joined_at", width: 15 },
    ]

    const data = filtered.map((m) => ({
      member_code: m.memberCode,
      full_name: m.fullName,
      email: m.email ?? "",
      phone: m.phone ?? "",
      national_id: m.nationalId ?? "",
      status: m.status,
      date_of_birth: m.dateOfBirth ?? "",
      address: m.address ?? "",
      next_of_kin: m.nextOfKin ?? "",
      next_of_kin_phone: m.nextOfKinPhone ?? "",
      joined_at: m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "",
    }))

    worksheet.addRows(data)

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sacco-members.xlsx"
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success("Members exported to Excel")
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {members.length} total members
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowImport(true)}
          >
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

      {/* Toolbar */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {/* Left — View Toggle */}
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "table" | "grid")}
        >
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

        {/* Right — Search + Filter */}
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
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value ?? "all")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="exited">Exited</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === "table" ? (
        <MembersTable members={filtered} />
      ) : (
        <MembersGrid members={filtered} />
      )}

      {/* Import Modal */}
      <ImportExcel open={showImport} onClose={() => setShowImport(false)} />
    </div>
  )
}

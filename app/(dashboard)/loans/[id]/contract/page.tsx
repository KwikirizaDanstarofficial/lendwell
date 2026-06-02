"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@powersync/react"
import { pdf, PDFViewer } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Download,
  Loader2,
  FileText,
  User,
  Calendar,
  Banknote,
} from "lucide-react"
import { toast } from "sonner"
import { LoanContractDocument } from "@/lib/pdf/loan-contract"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { fetchSaccoSettings } from "@/lib/utils/fetch-sacco-settings"

const statusMeta: Record<string, { color: string; bg: string }> = {
  pending:  { color: "#f59e0b", bg: "#f59e0b15" },
  approved: { color: "#3b82f6", bg: "#3b82f615" },
  active:   { color: "#10b981", bg: "#10b98115" },
  disbursed:{ color: "#8b5cf6", bg: "#8b5cf615" },
  settled:  { color: "#6b7280", bg: "#6b728015" },
  declined: { color: "#ef4444", bg: "#ef444415" },
  defaulted:{ color: "#dc2626", bg: "#dc262615" },
}

export default function LoanContractPage() {
  const params = useParams()
  const loanId = params.id as string

  // Load loan + member from local PowerSync SQLite — works offline
  const { data: loanRows = [] } = useQuery(
    `SELECT l.*, m.full_name AS member_name, m.member_code AS member_code_val,
             m.phone AS member_phone, m.national_id AS member_national_id,
             m.address AS member_address
       FROM loans l LEFT JOIN members m ON m.id = l.member_id
       WHERE l.id = ? LIMIT 1`,
    [loanId]
  )

  const [sacco, setSacco] = useState<any>({})
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchSaccoSettings().then(setSacco)
  }, [])

  const r = loanRows[0] as any

  if (!r) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 pt-6">
        <Link href="/loans" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Loans
        </Link>
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
          <FileText className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm font-medium">Loan not found or not yet synced.</p>
        </div>
      </div>
    )
  }

  const loan = {
    id: r.id,
    loanRef: r.loan_ref,
    amount: Number(r.amount),
    expectedReceived: Number(r.expected_received ?? r.amount),
    balance: Number(r.balance),
    interestRate: r.interest_rate ?? null,
    interestType: r.interest_type ?? null,
    durationMonths: r.duration_months ?? null,
    monthlyPayment: Number(r.monthly_payment ?? 0),
    dailyPayment: Number(r.daily_payment ?? 0),
    latePenaltyFee: Number(r.late_penalty_fee ?? 0),
    dueDate: r.due_date ?? null,
    createdAt: r.created_at ? new Date(r.created_at) : null,
    notes: r.notes ?? null,
    status: r.status,
    member_name: r.member_name ?? "",
    member_code: r.member_code_val ?? "",
    member_phone: r.member_phone ?? null,
    member_national_id: r.member_national_id ?? null,
    member_address: r.member_address ?? null,
  }

  const saccoProps = {
    name: sacco?.name ?? "SACCO",
    address: sacco?.address,
    phone: sacco?.contactPhone,
    email: sacco?.contactEmail,
    logoUrl: sacco?.logoUrl,
    tagline: sacco?.tagline,
    primaryColor: sacco?.primaryColor,
  }

  const memberProps = {
    fullName: loan.member_name,
    memberCode: loan.member_code,
    phone: loan.member_phone,
    nationalId: loan.member_national_id,
    address: loan.member_address,
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const latestSacco = await fetchSaccoSettings()
      const doc = (
        <LoanContractDocument
          loan={loan}
          member={memberProps}
          sacco={{
            name: latestSacco?.name ?? saccoProps.name,
            address: latestSacco?.address ?? saccoProps.address,
            phone: latestSacco?.contactPhone ?? saccoProps.phone,
            email: latestSacco?.contactEmail ?? saccoProps.email,
            logoUrl: latestSacco?.logoUrl ?? saccoProps.logoUrl,
            tagline: latestSacco?.tagline ?? saccoProps.tagline,
            primaryColor: latestSacco?.primaryColor ?? saccoProps.primaryColor,
          }}
        />
      )
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${loan.loanRef}-Contract.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Loan contract downloaded")
    } catch {
      toast.error("Failed to generate contract")
    } finally {
      setDownloading(false)
    }
  }

  const sm = statusMeta[loan.status] ?? { color: "#6b7280", bg: "#6b728015" }

  const doc = (
    <LoanContractDocument loan={loan} member={memberProps} sacco={saccoProps} />
  )

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <Link href="/loans" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Loans
        </Link>
        <Button onClick={handleDownload} disabled={downloading} className="h-9 gap-2 rounded-xl px-5 text-sm font-medium shadow-sm">
          {downloading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</> : <><Download className="h-4 w-4" />Download PDF</>}
        </Button>
      </div>

      {/* ── Contract meta card ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="h-[3px] w-full" style={{ background: sm.color }} />
        <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: sm.bg }}>
              <FileText className="h-5 w-5" style={{ color: sm.color }} />
            </div>
            <div>
              <p className="mb-0.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">Loan Contract</p>
              <h1 className="font-mono text-lg font-bold tracking-tight text-foreground">{loan.loanRef}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize" style={{ color: sm.color, background: sm.bg, borderColor: `${sm.color}30` }}>
              {loan.status}
            </span>
            {loan.member_name && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />{loan.member_name}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              <Banknote className="h-3 w-3" />{formatUGX(loan.amount)}
            </span>
            {loan.dueDate && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />Due {formatDate(loan.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── PDF Viewer ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="h-[calc(100vh-300px)] min-h-[520px]">
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            {doc}
          </PDFViewer>
        </div>
      </div>
    </div>
  )
}

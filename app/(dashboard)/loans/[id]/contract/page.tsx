"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { pdf, PDFViewer } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Download,
  Loader2,
  FileText,
  User,
  Hash,
  Calendar,
  Banknote,
} from "lucide-react"
import { toast } from "sonner"
import { LoanContractDocument } from "@/lib/pdf/loan-contract"
import { formatUGX, formatDate } from "@/lib/utils/format"

interface Loan {
  id: string
  loanRef: string
  amount: number
  expectedReceived: number
  balance: number
  interestRate: string | null
  interestType: string | null
  durationMonths: number | null
  monthlyPayment: number | null
  dailyPayment: number | null
  latePenaltyFee: number | null
  dueDate: string | Date | null
  status: string
  createdAt: Date | null
  notes: string | null
  memberId: string
  member_name?: string
  member_code?: string
  member_phone?: string | null
  member_national_id?: string | null
  member_address?: string | null
}

const statusMeta: Record<string, { color: string; bg: string }> = {
  pending: { color: "#f59e0b", bg: "#f59e0b15" },
  approved: { color: "#3b82f6", bg: "#3b82f615" },
  active: { color: "#10b981", bg: "#10b98115" },
  disbursed: { color: "#8b5cf6", bg: "#8b5cf615" },
  settled: { color: "#6b7280", bg: "#6b728015" },
  declined: { color: "#ef4444", bg: "#ef444415" },
  defaulted: { color: "#dc2626", bg: "#dc262615" },
}

export default function LoanContractPage() {
  const params = useParams()
  const loanId = params.id as string
  const [loan, setLoan] = useState<Loan | null>(null)
  const [sacco, setSacco] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch loan data
        const loanResponse = await fetch(`/api/loans/${loanId}`)
        if (!loanResponse.ok) throw new Error("Failed to fetch loan")
        const loanData = await loanResponse.json()
        setLoan(loanData)

        // Fetch SACCO data (assuming we can get it from settings API)
        const saccoResponse = await fetch("/api/settings")
        if (saccoResponse.ok) {
          const saccoData = await saccoResponse.json()
          setSacco(saccoData)
        } else {
          // Fallback to basic SACCO info
          setSacco({
            name: "SACCO",
            address: "Address not available",
            phone: "Phone not available",
            email: "Email not available",
          })
        }
      } catch {
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [loanId])

  const handleDownload = async () => {
    if (!loan) return
    setDownloading(true)
    try {
      const doc = (
        <LoanContractDocument
          loan={{
            loanRef: loan.loanRef,
            amount: loan.amount,
            expectedReceived: loan.expectedReceived,
            balance: loan.balance,
            interestRate: loan.interestRate,
            interestType: loan.interestType,
            durationMonths: loan.durationMonths,
            dailyPayment: loan.dailyPayment,
            monthlyPayment: loan.monthlyPayment,
            latePenaltyFee: loan.latePenaltyFee,
            dueDate: loan.dueDate,
            createdAt: loan.createdAt,
            notes: loan.notes,
          }}
          member={{
            fullName: loan.member_name ?? "",
            memberCode: loan.member_code ?? "",
            phone: loan.member_phone,
            nationalId: loan.member_national_id,
            address: loan.member_address,
          }}
          sacco={{
            name: sacco?.name ?? "SACCO",
            address: sacco?.address,
            phone: sacco?.contactPhone,
            email: sacco?.contactEmail,
            logoUrl: sacco?.logoUrl,
            tagline: sacco?.tagline,
            primaryColor: sacco?.primaryColor,
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

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin" />
        <p className="text-sm">Loading contract…</p>
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!loan) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 pt-6">
        <Link
          href="/loans"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Loans
        </Link>
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
          <FileText className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm font-medium">Loan not found</p>
        </div>
      </div>
    )
  }

  const sm = statusMeta[loan.status] ?? { color: "#6b7280", bg: "#6b728015" }

  const doc = (
    <LoanContractDocument
      loan={{
        loanRef: loan.loanRef,
        amount: loan.amount,
        expectedReceived: loan.expectedReceived,
        balance: loan.balance,
        interestRate: loan.interestRate,
        interestType: loan.interestType,
        durationMonths: loan.durationMonths,
        dailyPayment: loan.dailyPayment,
        monthlyPayment: loan.monthlyPayment,
        latePenaltyFee: loan.latePenaltyFee,
        dueDate: loan.dueDate,
        createdAt: loan.createdAt,
        notes: loan.notes,
      }}
      member={{
        fullName: loan.member_name ?? "",
        memberCode: loan.member_code ?? "",
        phone: loan.member_phone,
        nationalId: loan.member_national_id,
        address: loan.member_address,
      }}
      sacco={{
        name: sacco?.name ?? "SACCO",
        address: sacco?.address,
        phone: sacco?.contactPhone,
        email: sacco?.contactEmail,
        logoUrl: sacco?.logoUrl,
        tagline: sacco?.tagline,
        primaryColor: sacco?.primaryColor,
      }}
    />
  )

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/loans"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Loans
        </Link>

        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="h-9 gap-2 rounded-xl px-5 text-sm font-medium shadow-sm"
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {/* ── Contract meta card ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Top accent bar */}
        <div className="h-[3px] w-full" style={{ background: sm.color }} />

        <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: icon + title */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: sm.bg }}
            >
              <FileText className="h-5 w-5" style={{ color: sm.color }} />
            </div>
            <div>
              <p className="mb-0.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Loan Contract
              </p>
              <h1 className="font-mono text-lg font-bold tracking-tight text-foreground">
                {loan.loanRef}
              </h1>
            </div>
          </div>

          {/* Right: quick meta chips */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status badge */}
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize"
              style={{
                color: sm.color,
                background: sm.bg,
                borderColor: `${sm.color}30`,
              }}
            >
              {loan.status}
            </span>

            {loan.member_name && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {loan.member_name}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              <Banknote className="h-3 w-3" />
              {formatUGX(loan.amount)}
            </span>

            {loan.dueDate && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Due {formatDate(loan.dueDate)}
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

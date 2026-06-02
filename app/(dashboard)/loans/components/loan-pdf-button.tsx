"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { FileText, Loader2 } from "lucide-react"
import { LoanContractDocument } from "@/lib/pdf/loan-contract"
import { toast } from "sonner"
import { fetchSaccoSettings } from "@/lib/utils/fetch-sacco-settings"

export function LoanPdfButton({ loan }: { loan: any }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async (e: Event) => {
    e.preventDefault()
    setLoading(true)
    try {
      const rawSacco = await fetchSaccoSettings()

      const doc = (
        <LoanContractDocument
          loan={{
            loanRef: loan.loanRef ?? loan.loan_ref ?? "",
            amount: loan.amount ?? 0,
            expectedReceived: loan.expectedReceived ?? loan.expected_received ?? 0,
            balance: loan.balance ?? 0,
            interestRate: loan.interestRate ?? loan.interest_rate ?? null,
            interestType: loan.interestType ?? loan.interest_type ?? null,
            durationMonths: loan.durationMonths ?? loan.duration_months ?? null,
            dailyPayment: loan.dailyPayment ?? loan.daily_payment ?? null,
            monthlyPayment: loan.monthlyPayment ?? loan.monthly_payment ?? null,
            latePenaltyFee: loan.latePenaltyFee ?? loan.late_penalty_fee ?? null,
            dueDate: loan.dueDate ?? loan.due_date ?? null,
            createdAt: loan.createdAt ?? loan.created_at ?? null,
            notes: loan.notes ?? null,
          }}
          member={{
            fullName: loan.memberName ?? loan.member_name ?? "",
            memberCode: loan.memberCode ?? loan.member_code ?? "",
            phone: loan.memberPhone ?? loan.member_phone ?? null,
            nationalId: loan.memberNationalId ?? loan.member_national_id ?? null,
            address: loan.memberAddress ?? loan.member_address ?? null,
          }}
          sacco={{
            name: rawSacco.name ?? "SACCO",
            address: rawSacco.address,
            phone: rawSacco.contactPhone,
            email: rawSacco.contactEmail,
            logoUrl: rawSacco.logoUrl,
            tagline: rawSacco.tagline,
            primaryColor: rawSacco.primaryColor,
          }}
        />
      )
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${loan.loanRef ?? loan.loan_ref ?? "loan"}-Contract.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Loan contract downloaded")
    } catch {
      toast.error("Failed to generate contract")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenuItem
      onSelect={(e) => handleDownload(e as unknown as Event)}
      className="text-teal-600"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-2 h-4 w-4" />
      )}
      Download Contract PDF
    </DropdownMenuItem>
  )
}

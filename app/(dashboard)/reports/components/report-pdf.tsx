"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { ReportDocument } from "@/lib/pdf/report-document"
import { toast } from "sonner"

interface ReportPdfButtonProps {
  type: "overview" | "loans" | "savings" | "members" | "fines" | "transactions"
  sacco: any
  stats: any
  loans?: any[]
  savings?: any[]
  members?: any[]
  fines?: any[]
  transactions?: any[]
  complaints?: any[]
  notifications?: any[]
  label?: string
}

export function ReportPdfButton({
  type,
  sacco,
  stats,
  loans,
  savings,
  members,
  fines,
  transactions,
  complaints,
  notifications,
  label = "Export PDF",
}: ReportPdfButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const doc = (
        <ReportDocument
          type={type}
          stats={stats}
          loans={loans}
          savings={savings}
          members={members}
          fines={fines}
          transactions={transactions}
          complaints={complaints}
          notifications={notifications}
          sacco={sacco}
        />
      )
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sacco-${type}-report-${new Date().toISOString().split("T")[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${type} report exported`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to generate PDF")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={loading}
      className="border-teal-300 text-teal-600 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  )
}

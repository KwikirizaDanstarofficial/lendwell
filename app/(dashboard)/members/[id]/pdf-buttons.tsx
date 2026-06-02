"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import { FileText, CreditCard, Loader2 } from "lucide-react"
import { MemberIdCardDocument } from "@/lib/pdf/member-id-card"
import { fetchSaccoSettings } from "@/lib/utils/fetch-sacco-settings"

interface Member {
  id: string
  saccoId: string
  memberCode: string
  fullName: string
  email: string | null
  phone: string | null
  nationalId: string | null
  photoUrl: string | null
  dateOfBirth: string | null
  address: string | null
  nextOfKin: string | null
  nextOfKinPhone: string | null
  nextOfKinRelationship: string | null
  nextOfKinAddress: string | null
  status: string
  joinedAt: string | null
  createdAt: Date
  updatedAt: Date
}
import { ApplicationFormDocument } from "@/lib/pdf/application-form"
import { toast } from "sonner"

interface PdfButtonsProps {
  member: Member
}

export function PdfButtons({ member }: PdfButtonsProps) {
  const [loadingId, setLoadingId] = useState(false)
  const [loadingForm, setLoadingForm] = useState(false)

  const downloadIdCard = async () => {
    setLoadingId(true)
    try {
      const rawSacco = await fetchSaccoSettings()

      const doc = (
        <MemberIdCardDocument
          member={member}
          sacco={{
            name: rawSacco.name ?? "SACCO",
            logoUrl: rawSacco.logoUrl,
            primaryColor: rawSacco.primaryColor,
          }}
        />
      )
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${member.memberCode}-ID-Card.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("ID Card downloaded")
    } catch {
      toast.error("Failed to generate ID Card")
    } finally {
      setLoadingId(false)
    }
  }

  const downloadApplicationForm = async () => {
    setLoadingForm(true)
    try {
      const sacco = await fetchSaccoSettings()

      const doc = (
        <ApplicationFormDocument
          member={member}
          sacco={{
            name: sacco.name,
            address: sacco.address,
            contactPhone: sacco.contactPhone,
            contactEmail: sacco.contactEmail,
            logoUrl: sacco.logoUrl,
            tagline: sacco.tagline,
            primaryColor: sacco.primaryColor,
          }}
        />
      )
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${member.memberCode}-Application-Form.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Application Form downloaded")
    } catch {
      toast.error("Failed to generate Application Form")
    } finally {
      setLoadingForm(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950"
        onClick={downloadIdCard}
        disabled={loadingId}
      >
        {loadingId ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="mr-2 h-4 w-4" />
        )}
        Generate ID Card
      </Button>

      <Button
        type="button"
        variant="outline"
        className="border-teal-300 text-teal-600 hover:bg-teal-50 hover:text-teal-700 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950"
        onClick={downloadApplicationForm}
        disabled={loadingForm}
      >
        {loadingForm ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Application Form
      </Button>
    </>
  )
}

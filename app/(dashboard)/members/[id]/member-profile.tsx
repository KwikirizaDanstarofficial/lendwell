"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { pdf } from "@react-pdf/renderer"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { toast } from "sonner"
import {
  User,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Wallet,
  Receipt,
  Flag,
  FileText,
  Edit,
  Trash2,
  MoreVertical,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  updateMemberStatusAction,
  sendMemberSmsAction,
  assignLoanAction,
  addSavingsAction,
} from "../actions"
import { topUpLoanAction } from "../../loans/actions"
import { addFineAction } from "../../fines/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// Type definitions for member profile data
type Member = {
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
  joinedAt: string
  createdAt: Date
  updatedAt: Date
}

type Loan = {
  id: string
  saccoId: string
  memberId: string
  categoryId: string | null
  loanRef: string
  amount: number
  balance: number
  interestRate: string
  status: string
  dueDate: Date | null
  disbursedAt: Date | null
  settledAt: Date | null
  declineReason: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  interestRateId: string | null
  expectedReceived: number
  interestType: string
  durationMonths: number
  latePenaltyFee: number
  dailyPayment: number
  monthlyPayment: number
}

type SavingsAccount = {
  id: string
  saccoId: string
  memberId: string
  categoryId: string | null
  accountNumber: string
  balance: number
  accountType: string
  isLocked: boolean
  lockUntil: Date | null
  lockReason: string | null
  createdAt: Date
  updatedAt: Date
}

type Fine = {
  id: string
  fine_ref: string
  amount: number
  reason: string
  description: string
  status: string
  priority: string
  due_date: Date | null
  paid_at: Date | null
  payment_method: string | null
  payment_reference: string | null
  notes: string | null
  createdAt: string
  updated_at: string
  member_id: string
  category_id: string | null
}

type Transaction = {
  id: string
  saccoId: string
  memberId: string
  type: string
  amount: number
  balanceAfter: number
  referenceId: string | null
  paymentMethod: string
  narration: string
  createdAt: string
}
import { MemberIdCardDocument } from "@/lib/pdf/member-id-card"
import { ApplicationFormDocument } from "@/lib/pdf/application-form"
import { MemberTransactionsDocument } from "@/lib/pdf/member-transactions"

interface MemberProfileProps {
  member: Member
  sacco: any
  loans: Loan[]
  savings: SavingsAccount[]
  fines: Fine[]
  transactions: Transaction[]
  stats: {
    totalSavings: number
    totalLoans: number
    totalFines: number
    totalTransactions: number
  }
}

export function MemberProfile({
  member,
  sacco,
  loans,
  savings,
  fines,
  transactions,
  stats,
}: MemberProfileProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingId, setLoadingId] = useState(false)
  const [loadingForm, setLoadingForm] = useState(false)
  const [loadingTx, setLoadingTx] = useState(false)
  const [showSmsDialog, setShowSmsDialog] = useState(false)
  const [showLoanDialog, setShowLoanDialog] = useState(false)
  const [showSavingsDialog, setShowSavingsDialog] = useState(false)
  const [showFineDialog, setShowFineDialog] = useState(false)
  const [showTopUpDialog, setShowTopUpDialog] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<any>(null)
  const [imageError, setImageError] = useState(false)
  const [smsMessage, setSmsMessage] = useState("")
  const [loanAmount, setLoanAmount] = useState("")
  const [loanInterestRate, setLoanInterestRate] = useState("")
  const [loanDueDate, setLoanDueDate] = useState("")
  const [loanPurpose, setLoanPurpose] = useState("")
  const [savingsAmount, setSavingsAmount] = useState("")
  const [savingsNarration, setSavingsNarration] = useState("")
  const [fineAmount, setFineAmount] = useState("")
  const [fineReason, setFineReason] = useState("")
  const [fineDescription, setFineDescription] = useState("")
  const [topUpAmount, setTopUpAmount] = useState("")
  const [topUpReason, setTopUpReason] = useState("")
  const [topUpPaymentMethod, setTopUpPaymentMethod] = useState("cash")
  const [topUpNotes, setTopUpNotes] = useState("")

  const downloadIdCard = async () => {
    setLoadingId(true)
    try {
      const doc = (
        <MemberIdCardDocument
          member={member}
          sacco={{ name: sacco?.name || "SACCO" }}
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
      const doc = (
        <ApplicationFormDocument
          member={member}
          sacco={
            sacco || {
              name: "SACCO",
              address: "Address not available",
              contact_phone: "Phone not available",
              contact_email: "Email not available",
            }
          }
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

  const downloadTransactions = async () => {
    setLoadingTx(true)
    try {
      const saccoResponse = await fetch("/api/settings")
      const rawSacco = saccoResponse.ok ? await saccoResponse.json() : {}
      const doc = (
        <MemberTransactionsDocument
          member={member}
          transactions={transactions}
          sacco={{
            name: rawSacco.name,
            address: rawSacco.address,
            contactPhone: rawSacco.contactPhone,
            contactEmail: rawSacco.contactEmail,
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
      a.download = `${member.memberCode}-Transactions.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Transaction statement downloaded")
    } catch {
      toast.error("Failed to generate transaction statement")
    } finally {
      setLoadingTx(false)
    }
  }

  const handleStatusChange = async (
    status: "active" | "suspended" | "exited"
  ) => {
    setIsLoading(true)
    try {
      const result = await updateMemberStatusAction(member.id, status)
      if (result.success) {
        toast.success(`Member status updated to ${status}`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update status")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendSms = async () => {
    if (!smsMessage.trim()) {
      toast.error("Please enter a message")
      return
    }
    setIsLoading(true)
    try {
      const result = await sendMemberSmsAction(member.id, smsMessage)
      if (result.success) {
        toast.success("SMS sent successfully")
        setShowSmsDialog(false)
        setSmsMessage("")
      } else {
        toast.error(result.error || "Failed to send SMS")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignLoan = async () => {
    if (!loanAmount || !loanInterestRate || !loanDueDate) {
      toast.error("Please fill in all required fields")
      return
    }
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("amount", loanAmount)
      formData.append("interest_rate", loanInterestRate)
      formData.append("due_date", loanDueDate)
      formData.append("purpose", loanPurpose)
      const result = await assignLoanAction(member.id, {}, formData)
      if (result.success) {
        toast.success("Loan assigned successfully")
        setShowLoanDialog(false)
        setLoanAmount("")
        setLoanInterestRate("")
        setLoanDueDate("")
        setLoanPurpose("")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to assign loan")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSavings = async () => {
    if (!savingsAmount) {
      toast.error("Please enter an amount")
      return
    }
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("amount", savingsAmount)
      formData.append("narration", savingsNarration)
      const result = await addSavingsAction(member.id, {}, formData)
      if (result.success) {
        toast.success("Savings added successfully")
        setShowSavingsDialog(false)
        setSavingsAmount("")
        setSavingsNarration("")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to add savings")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFine = async () => {
    if (!fineAmount || !fineReason) {
      toast.error("Please fill in all required fields")
      return
    }
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("member_id", member.id)
      formData.append("amount", fineAmount)
      formData.append("reason", fineReason)
      formData.append("description", fineDescription)
      const result = await addFineAction({}, formData)
      if (result.success) {
        toast.success("Fine added successfully")
        setShowFineDialog(false)
        setFineAmount("")
        setFineReason("")
        setFineDescription("")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to add fine")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTopUpLoan = async () => {
    if (!topUpAmount || !topUpReason) {
      toast.error("Please fill in all required fields")
      return
    }
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("loan_id", selectedLoan.id)
      formData.append("amount", topUpAmount)
      formData.append("reason", topUpReason)
      formData.append("payment_method", topUpPaymentMethod)
      formData.append("notes", topUpNotes)
      const result = await topUpLoanAction({}, formData)
      if (result.success) {
        toast.success("Loan top-up processed successfully")
        setShowTopUpDialog(false)
        setSelectedLoan(null)
        setTopUpAmount("")
        setTopUpReason("")
        setTopUpPaymentMethod("cash")
        setTopUpNotes("")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to process top-up")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "suspended":
        return "bg-yellow-100 text-yellow-800"
      case "exited":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getLoanStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "disbursed":
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />
      case "settled":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getFineStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "waived":
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  // ── small helpers (inline, no separate component needed) ──────────────────
  const InfoItem = ({
    label,
    value,
    accent,
  }: {
    label: string
    value: React.ReactNode
    accent?: "green" | "orange" | "red" | "blue"
  }) => {
    const color =
      accent === "green"
        ? "text-green-600 dark:text-green-400"
        : accent === "orange"
          ? "text-orange-500 dark:text-orange-400"
          : accent === "red"
            ? "text-red-500 dark:text-red-400"
            : accent === "blue"
              ? "text-blue-600 dark:text-blue-400"
              : "text-foreground"
    return (
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
        <p className={`text-sm font-semibold ${color}`}>{value}</p>
      </div>
    )
  }

  const SectionHeader = ({
    icon: Icon,
    title,
  }: {
    icon: React.ElementType
    title: string
  }) => (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <h2 className="text-sm font-semibold tracking-widest text-foreground uppercase">
        {title}
      </h2>
    </div>
  )

  const StatTile = ({
    label,
    value,
    accent,
  }: {
    label: string
    value: string
    accent: "green" | "blue" | "orange" | "purple"
  }) => {
    const ring =
      accent === "green"
        ? "border-green-200 dark:border-green-800"
        : accent === "blue"
          ? "border-blue-200 dark:border-blue-800"
          : accent === "orange"
            ? "border-orange-200 dark:border-orange-800"
            : "border-purple-200 dark:border-purple-800"
    const text =
      accent === "green"
        ? "text-green-600 dark:text-green-400"
        : accent === "blue"
          ? "text-blue-600 dark:text-blue-400"
          : accent === "orange"
            ? "text-orange-500 dark:text-orange-400"
            : "text-purple-600 dark:text-purple-400"
    return (
      <div
        className={`rounded-xl border ${ring} flex flex-col gap-1 bg-background px-4 py-3`}
      >
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
        <p className={`text-lg font-bold ${text}`}>{value}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* ── Page header: back + actions ── */}
      <div className="flex items-center justify-between">
        <Link href="/members">
          <button className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Members
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTransactions}
            disabled={loadingTx || transactions.length === 0}
          >
            {loadingTx ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Receipt className="mr-2 h-4 w-4" />
            )}
            {loadingTx ? "Generating…" : "Print Transactions"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MoreVertical className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSmsDialog(true)}>
                <Phone className="mr-2 h-4 w-4" />
                Send SMS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadIdCard} disabled={loadingId}>
                {loadingId ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                {loadingId ? "Generating…" : "Generate ID Card"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={downloadApplicationForm}
                disabled={loadingForm}
              >
                {loadingForm ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                {loadingForm ? "Generating…" : "Application Form"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("active")}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Set Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("suspended")}>
                <AlertCircle className="mr-2 h-4 w-4" />
                Suspend
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("exited")}>
                <XCircle className="mr-2 h-4 w-4" />
                Exit Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Hero bar ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
            {member.photoUrl && !imageError ? (
              <Image
                src={member.photoUrl}
                alt={`${member.fullName} photo`}
                width={64}
                height={64}
                className="h-full w-full object-cover"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="mb-0.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Member Code
            </p>
            <h1 className="font-mono text-xl font-bold text-foreground">
              {member.memberCode}
            </h1>
            <p className="text-base font-semibold text-foreground">
              {member.fullName}
            </p>
          </div>
        </div>
        <Badge className={`${getStatusColor(member.status)} px-3 py-1 text-sm capitalize`}>
          {member.status}
        </Badge>
      </div>

      {/* ── Suspended / exited banner ── */}
      {(member.status === "suspended" || member.status === "exited") && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">
            This member&apos;s account is <strong>{member.status}</strong>.
            Update status from the Actions menu to reactivate.
          </p>
        </div>
      )}

      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Total Savings"
          value={formatUGX(stats.totalSavings)}
          accent="green"
        />
        <StatTile
          label="Active Loans"
          value={formatUGX(stats.totalLoans)}
          accent="blue"
        />
        <StatTile
          label="Total Fines"
          value={formatUGX(stats.totalFines)}
          accent="orange"
        />
        <StatTile
          label="Transactions"
          value={String(stats.totalTransactions)}
          accent="purple"
        />
      </div>

      {/* ── Two-col: Member Details + Next of Kin ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Member Details */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <SectionHeader icon={User} title="Member Details" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <InfoItem label="Phone" value={member.phone || "—"} />
            <InfoItem label="Email" value={member.email || "—"} />
            <InfoItem label="National ID" value={member.nationalId || "—"} />
            <InfoItem
              label="Date of Birth"
              value={
                member.dateOfBirth ? formatDate(member.dateOfBirth) : "—"
              }
            />
            <InfoItem
              label="Address"
              value={member.address || "—"}
            />
            <InfoItem label="Joined" value={formatDate(member.joinedAt)} />
          </div>
        </div>

        {/* Next of Kin */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <SectionHeader icon={UserCheck} title="Next of Kin" />
          {member.nextOfKin ||
          member.nextOfKinRelationship ||
          member.nextOfKinPhone ||
          member.nextOfKinAddress ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <InfoItem label="Name" value={member.nextOfKin || "—"} />
              <InfoItem
                label="Relationship"
                value={member.nextOfKinRelationship || "—"}
              />
              <InfoItem
                label="Phone"
                value={member.nextOfKinPhone || "—"}
              />
              <InfoItem
                label="Address"
                value={member.nextOfKinAddress || "—"}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No next of kin recorded.
            </p>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="loans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowLoanDialog(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Assign Loan
            </Button>
          </div>
          {loans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No loans found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => {
                const repaid = loan.expectedReceived - loan.balance
                const progress = loan.expectedReceived > 0
                  ? Math.min(100, Math.round((repaid / loan.expectedReceived) * 100))
                  : 0
                return (
                  <div
                    key={loan.id}
                    className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4"
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-0.5">
                          Loan Reference
                        </p>
                        <p className="font-mono text-base font-bold text-foreground">
                          {loan.loanRef}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className={getStatusColor(loan.status)}>
                          {loan.status}
                        </Badge>
                        {(loan.status === "active" || loan.status === "disbursed") && (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-green-500 transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-foreground">
                                {progress}%
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedLoan(loan)
                                setShowTopUpDialog(true)
                              }}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Top Up
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Principal</p>
                        <p className="text-sm font-semibold text-foreground">{formatUGX(loan.amount)}</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Total to Repay</p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">{formatUGX(loan.expectedReceived)}</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Balance</p>
                        <p className="text-sm font-semibold text-orange-500 dark:text-orange-400">{formatUGX(loan.balance)}</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Interest</p>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {loan.interestRate}% · {loan.interestType}
                        </p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Duration</p>
                        <p className="text-sm font-semibold text-foreground">{loan.durationMonths} months</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Due Date</p>
                        <p className="text-sm font-semibold text-foreground">{formatDate(loan.dueDate)}</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Daily Payment</p>
                        <p className="text-sm font-semibold text-foreground">{formatUGX(loan.dailyPayment)}</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Monthly Payment</p>
                        <p className="text-sm font-semibold text-foreground">{formatUGX(loan.monthlyPayment)}</p>
                      </div>
                    </div>

                    {loan.declineReason && (
                      <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <p className="text-sm text-destructive">{loan.declineReason}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowSavingsDialog(true)}>
              <Wallet className="mr-2 h-4 w-4" />
              Add Savings
            </Button>
          </div>
          {savings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Wallet className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No savings accounts found
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {savings.map((account) => (
                <Card key={account.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{account.accountNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.accountType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatUGX(account.balance)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {account.isLocked ? "Locked" : "Active"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fines" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowFineDialog(true)}>
              <Flag className="mr-2 h-4 w-4" />
              Add Fine
            </Button>
          </div>
          {fines.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Flag className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No fines found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {fines.map((fine) => (
                <Card key={fine.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getFineStatusIcon(fine.status)}
                        <div>
                          <p className="font-medium">{fine.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(fine.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatUGX(fine.amount)}</p>
                        <Badge
                          variant={
                            fine.status === "paid" ? "default" : "secondary"
                          }
                        >
                          {fine.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No transactions found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {transaction.type === "savings_deposit" ||
                        transaction.type === "fine_payment" ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">
                            {transaction.narration || transaction.type}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "font-medium",
                            transaction.type === "savings_deposit" ||
                              transaction.type === "fine_payment"
                              ? "text-green-600"
                              : "text-red-600"
                          )}
                        >
                          {transaction.type === "savings_deposit" ||
                          transaction.type === "fine_payment"
                            ? "+"
                            : "-"}
                          {formatUGX(transaction.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Balance:{" "}
                          {transaction.balanceAfter != null
                            ? formatUGX(transaction.balanceAfter)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* SMS Dialog */}
      <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send SMS to {member.fullName}</DialogTitle>
            <DialogDescription>
              Send a text message to this member's phone number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={member.phone || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSmsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendSms} disabled={isLoading}>
              {isLoading ? "Sending..." : "Send SMS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loan Dialog */}
      <Dialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Loan to {member.fullName}</DialogTitle>
            <DialogDescription>
              Create a new loan for this member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Amount (UGX)</Label>
              <Input
                id="loanAmount"
                type="number"
                placeholder="Enter amount"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                placeholder="Enter interest rate"
                value={loanInterestRate}
                onChange={(e) => setLoanInterestRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={loanDueDate}
                onChange={(e) => setLoanDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                placeholder="Enter loan purpose..."
                value={loanPurpose}
                onChange={(e) => setLoanPurpose(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignLoan} disabled={isLoading}>
              {isLoading ? "Assigning..." : "Assign Loan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Savings Dialog */}
      <Dialog open={showSavingsDialog} onOpenChange={setShowSavingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Savings for {member.fullName}</DialogTitle>
            <DialogDescription>
              Add a savings deposit for this member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="savingsAmount">Amount (UGX)</Label>
              <Input
                id="savingsAmount"
                type="number"
                placeholder="Enter amount"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="narration">Narration</Label>
              <Textarea
                id="narration"
                placeholder="Enter narration..."
                value={savingsNarration}
                onChange={(e) => setSavingsNarration(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSavingsDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSavings} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Savings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fine Dialog */}
      <Dialog open={showFineDialog} onOpenChange={setShowFineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Fine for {member.fullName}</DialogTitle>
            <DialogDescription>
              Create a new fine for this member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fineAmount">Amount (UGX)</Label>
              <Input
                id="fineAmount"
                type="number"
                placeholder="Enter amount"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="Enter reason"
                value={fineReason}
                onChange={(e) => setFineReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fineDescription">Description</Label>
              <Textarea
                id="fineDescription"
                placeholder="Enter description..."
                value={fineDescription}
                onChange={(e) => setFineDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFineDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFine} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Fine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Up Dialog */}
      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Loan</DialogTitle>
            <DialogDescription>
              Add additional funds to loan {selectedLoan?.loan_ref}. Current
              balance: {formatUGX(selectedLoan?.balance || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topUpAmount">Top-up Amount (UGX)</Label>
              <Input
                id="topUpAmount"
                type="number"
                placeholder="Enter amount"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topUpReason">Reason *</Label>
              <Input
                id="topUpReason"
                placeholder="e.g., Additional purchase, Emergency funds"
                value={topUpReason}
                onChange={(e) => setTopUpReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topUpPaymentMethod">Payment Method</Label>
              <Select
                value={topUpPaymentMethod}
                onValueChange={(value) => value && setTopUpPaymentMethod(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topUpNotes">Notes</Label>
              <Textarea
                id="topUpNotes"
                placeholder="Additional notes (optional)"
                value={topUpNotes}
                onChange={(e) => setTopUpNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTopUpDialog(false)
                setSelectedLoan(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleTopUpLoan} disabled={isLoading}>
              {isLoading ? "Processing..." : "Top Up Loan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

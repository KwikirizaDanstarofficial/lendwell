import { supabaseAdmin } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getMemberStatsAction } from "../actions"
import { getSaccoSettings } from "@/db/queries/settings"
import { requireAuth } from "@/lib/auth"
import { MemberProfile } from "./member-profile"

interface MemberPageProps {
  params: Promise<{ id: string }>
}

export default async function MemberPage({ params }: MemberPageProps) {
  const user = await requireAuth()
  const { id } = await params

  const supabase = supabaseAdmin

  const { data: member, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !member) notFound()

  const [data, sacco] = await Promise.all([
    getMemberStatsAction(id),
    getSaccoSettings(user.saccoId),
  ])

  // Format the data to match component type expectations
  const formattedLoans = (data?.loans || []).map(loan => ({
    id: loan.id,
    saccoId: loan.saccoId,
    memberId: loan.memberId,
    categoryId: loan.categoryId,
    loanRef: loan.loanRef,
    amount: loan.amount,
    balance: loan.balance,
    interestRate: loan.interestRate,
    status: loan.status,
    dueDate: loan.dueDate,
    disbursedAt: loan.disbursedAt,
    settledAt: loan.settledAt,
    declineReason: loan.declineReason,
    notes: loan.notes,
    createdAt: typeof loan.createdAt === 'string' ? loan.createdAt : loan.createdAt.toISOString(),
    updatedAt: typeof loan.updatedAt === 'string' ? loan.updatedAt : loan.updatedAt.toISOString(),
    interestRateId: loan.interestRateId,
    expectedReceived: loan.expectedReceived,
    interestType: loan.interestType,
    durationMonths: loan.durationMonths,
    latePenaltyFee: loan.latePenaltyFee,
    dailyPayment: loan.dailyPayment,
    monthlyPayment: loan.monthlyPayment,
  }))

  const formattedSavings = (data?.savings || []).map(saving => ({
    id: saving.id,
    saccoId: saving.saccoId,
    memberId: saving.memberId,
    categoryId: saving.categoryId,
    accountNumber: saving.accountNumber,
    balance: saving.balance,
    accountType: saving.accountType,
    isLocked: saving.isLocked,
    lockUntil: saving.lockUntil,
    lockReason: saving.lockReason,
    createdAt: saving.createdAt,
    updatedAt: saving.updatedAt,
  }))

  const formattedFines = (data?.fines || []).map(fine => ({
    id: fine.id,
    fine_ref: fine.fine_ref,
    amount: fine.amount,
    reason: fine.reason,
    description: fine.description,
    status: fine.status,
    priority: fine.priority,
    due_date: fine.due_date,
    paid_at: fine.paid_at,
    payment_method: fine.payment_method,
    payment_reference: fine.payment_reference,
    notes: fine.notes,
    createdAt: fine.created_at instanceof Date ? fine.created_at.toISOString() : fine.created_at,
    updated_at: fine.updated_at instanceof Date ? fine.updated_at.toISOString() : fine.updated_at,
    member_id: fine.member_id,
    category_id: fine.category_id,
  }))

  const formattedTransactions = (data?.transactions || []).map(tx => ({
    id: tx.id,
    saccoId: tx.saccoId,
    memberId: tx.memberId,
    type: tx.type,
    amount: tx.amount,
    balanceAfter: tx.balanceAfter,
    referenceId: tx.referenceId,
    paymentMethod: tx.paymentMethod,
    narration: tx.narration,
    createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
  }))

  const formattedMember = {
    id: member.id,
    saccoId: member.sacco_id,
    memberCode: member.member_code,
    fullName: member.full_name,
    email: member.email,
    phone: member.phone,
    nationalId: member.national_id,
    photoUrl: member.photo_url,
    dateOfBirth: member.date_of_birth,
    address: member.address,
    nextOfKin: member.next_of_kin,
    nextOfKinPhone: member.next_of_kin_phone,
    nextOfKinRelationship: member.next_of_kin_relationship,
    nextOfKinAddress: member.next_of_kin_address,
    status: member.status,
    joinedAt: member.joined_at,
    createdAt: new Date(member.created_at),
    updatedAt: new Date(member.updated_at),
  }

  return (
    <MemberProfile
      member={formattedMember}
      sacco={sacco}
      loans={formattedLoans}
      savings={formattedSavings}
      fines={formattedFines}
      transactions={formattedTransactions}
      stats={
        data?.stats ?? {
          totalSavings: 0,
          totalLoans: 0,
          totalFines: 0,
          totalTransactions: 0,
        }
      }
    />
  )
}

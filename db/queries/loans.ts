import { supabaseAdmin } from "@/lib/supabase/server"

export async function getAllLoans(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('loans')
    .select(`
      id, sacco_id, member_id, category_id, loan_ref, amount, balance,
      interest_rate, status, due_date, disbursed_at, settled_at,
      decline_reason, notes, created_at, updated_at,
      interest_rate_id, expected_received, interest_type,
      duration_months, late_penalty_fee, daily_payment, monthly_payment,
      members:member_id ( full_name, member_code, phone, national_id, address )
    `)
    .eq('sacco_id', saccoId)
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) {
    throw new Error(`Failed to fetch loans: ${error.message}`)
  }

  return data.map(loan => ({
    id: loan.id,
    saccoId: loan.sacco_id,
    memberId: loan.member_id,
    categoryId: loan.category_id,
    loanRef: loan.loan_ref,
    amount: loan.amount,
    balance: loan.balance,
    interestRate: loan.interest_rate,
    status: loan.status,
    dueDate: loan.due_date ? new Date(loan.due_date) : null,
    disbursedAt: loan.disbursed_at ? new Date(loan.disbursed_at) : null,
    settledAt: loan.settled_at ? new Date(loan.settled_at) : null,
    declineReason: loan.decline_reason,
    notes: loan.notes,
    createdAt: new Date(loan.created_at),
    updatedAt: new Date(loan.updated_at),
    interestRateId: loan.interest_rate_id,
    expectedReceived: loan.expected_received,
    interestType: loan.interest_type,
    durationMonths: loan.duration_months,
    latePenaltyFee: loan.late_penalty_fee,
    dailyPayment: loan.daily_payment,
    monthlyPayment: loan.monthly_payment,
    memberName: (loan.members as any)?.full_name ?? null,
    member_name: (loan.members as any)?.full_name ?? null,
    memberCode: (loan.members as any)?.member_code ?? null,
    memberPhone: (loan.members as any)?.phone ?? null,
    memberNationalId: (loan.members as any)?.national_id ?? null,
    memberAddress: (loan.members as any)?.address ?? null,
  }))
}

export async function getLoanById(id: string, saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('loans')
    .select('*')
    .eq('id', id)
    .eq('sacco_id', saccoId)
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw new Error(`Failed to fetch loan: ${error.message}`)
  }

  return {
    id: data.id,
    saccoId: data.sacco_id,
    memberId: data.member_id,
    categoryId: data.category_id,
    loanRef: data.loan_ref,
    amount: data.amount,
    balance: data.balance,
    interestRate: data.interest_rate,
    status: data.status,
    dueDate: data.due_date ? new Date(data.due_date) : null,
    disbursedAt: data.disbursed_at ? new Date(data.disbursed_at) : null,
    settledAt: data.settled_at ? new Date(data.settled_at) : null,
    declineReason: data.decline_reason,
    notes: data.notes,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    interestRateId: data.interest_rate_id,
    expectedReceived: data.expected_received,
    interestType: data.interest_type,
    durationMonths: data.duration_months,
    latePenaltyFee: data.late_penalty_fee,
    dailyPayment: data.daily_payment,
    monthlyPayment: data.monthly_payment,
  }
}

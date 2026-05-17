import { requireAuth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { getSaccoSettings } from "@/db/queries/settings"
import { ReportsClient } from "./components/reports-client"

export const revalidate = 60

export default async function ReportsPage() {
  const user = await requireAuth()
  const supabase = supabaseAdmin

  const [
    { data: loanStatData },
    { data: savingsStatData },
    { data: memberStatData },
    { data: fineStatData },
    { data: transactionStatData },
    { data: complaintStatData },
    { data: notificationStatData },
    { data: allLoans },
    { data: allSavingsData },
    { data: allMembers },
    { data: allFinesData },
    { data: allTransactionsData },
    { data: allComplaintsData },
    { data: allNotificationsData },
    { data: interestRatesList },
    { data: loanCategoriesList },
    { data: savingsCategoriesList },
    { data: fineCategoriesList },
    sacco,
  ] = await Promise.all([
    supabase.from('loans').select('amount, balance, expected_received, status').eq('sacco_id', user.saccoId),
    supabase.from('savings_accounts').select('balance, account_type, is_locked').eq('sacco_id', user.saccoId),
    supabase.from('members').select('status').eq('sacco_id', user.saccoId),
    supabase.from('fines').select('amount, status').eq('sacco_id', user.saccoId),
    supabase.from('transactions').select('amount, type').eq('sacco_id', user.saccoId),
    supabase.from('complaints').select('status').eq('sacco_id', user.saccoId),
    supabase.from('notifications').select('status').eq('sacco_id', user.saccoId),
    supabase.from('loans').select(`
      id, loan_ref, amount, expected_received, balance, interest_rate, interest_type,
      duration_months, daily_payment, monthly_payment, late_penalty_fee, status,
      due_date, created_at, disbursed_at, settled_at, notes, member_id,
      members:member_id ( full_name, member_code, phone ),
      loan_categories:category_id ( name )
    `).eq('sacco_id', user.saccoId).order('created_at', { ascending: false }).limit(200),
    supabase.from('savings_accounts').select(`
      id, account_number, balance, account_type, is_locked, lock_until, created_at, member_id,
      members:member_id ( full_name, member_code, phone ),
      savings_categories:category_id ( name )
    `).eq('sacco_id', user.saccoId).order('balance', { ascending: false }).limit(200),
    supabase.from('members').select('*').eq('sacco_id', user.saccoId).order('created_at', { ascending: false }).limit(200),
    supabase.from('fines').select(`
      id, fine_ref, amount, reason, description, status, priority, due_date, paid_at,
      payment_method, payment_reference, notes, created_at, member_id,
      members:member_id ( full_name, member_code ),
      fine_categories:category_id ( name )
    `).eq('sacco_id', user.saccoId).order('created_at', { ascending: false }).limit(200),
    supabase.from('transactions').select(`
      id, type, amount, balance_after, payment_method, narration, created_at, member_id,
      members:member_id ( full_name, member_code )
    `).eq('sacco_id', user.saccoId).order('created_at', { ascending: false }).limit(200),
    supabase.from('complaints').select(`
      id, complaint_ref, subject, body, category, priority, status, resolution_notes,
      satisfaction_rating, feedback, created_at, resolved_at, member_id,
      members:member_id ( full_name, member_code, phone )
    `).eq('sacco_id', user.saccoId).order('created_at', { ascending: false }).limit(200),
    supabase.from('notifications').select(`
      id, title, body, type, status, priority, channel, scheduled_at, sent_at,
      delivered_at, read_at, created_at, member_id,
      members:member_id ( full_name, member_code )
    `).eq('sacco_id', user.saccoId).order('created_at', { ascending: false }).limit(200),
    supabase.from('interest_rates').select('*').eq('sacco_id', user.saccoId).order('min_amount', { ascending: true }),
    supabase.from('loan_categories').select('*').eq('sacco_id', user.saccoId),
    supabase.from('savings_categories').select('*').eq('sacco_id', user.saccoId),
    supabase.from('fine_categories').select('*').eq('sacco_id', user.saccoId),
    getSaccoSettings(user.saccoId),
  ])

  // ─── Loan Stats ───────────────────────────────────────────────────────────
  const loanStats = {
    total: loanStatData?.reduce((sum, loan) => sum + loan.amount, 0) || 0,
    count: loanStatData?.length || 0,
    totalExpected: loanStatData?.reduce((sum, loan) => sum + loan.expected_received, 0) || 0,
  }
  const activeLoans = {
    total: loanStatData?.filter(l => l.status === 'active').reduce((sum, loan) => sum + loan.balance, 0) || 0,
    count: loanStatData?.filter(l => l.status === 'active').length || 0,
  }
  const disbursedLoans = {
    total: loanStatData?.filter(l => l.status === 'disbursed').reduce((sum, loan) => sum + loan.amount, 0) || 0,
    count: loanStatData?.filter(l => l.status === 'disbursed').length || 0,
  }
  const approvedLoans = { count: loanStatData?.filter(l => l.status === 'approved').length || 0 }
  const pendingLoans = { count: loanStatData?.filter(l => l.status === 'pending').length || 0 }
  const settledLoans = { count: loanStatData?.filter(l => l.status === 'settled').length || 0 }
  const defaultedLoans = { count: loanStatData?.filter(l => l.status === 'defaulted').length || 0 }

  // ─── Savings Stats ────────────────────────────────────────────────────────
  const savingsStats = {
    total: savingsStatData?.reduce((sum, account) => sum + account.balance, 0) || 0,
    count: savingsStatData?.length || 0,
  }
  const fixedSavings = {
    total: savingsStatData?.filter(s => s.account_type === 'fixed').reduce((sum, account) => sum + account.balance, 0) || 0,
    count: savingsStatData?.filter(s => s.account_type === 'fixed').length || 0,
  }
  const lockedSavings = { count: savingsStatData?.filter(s => s.is_locked).length || 0 }

  // ─── Member Stats ─────────────────────────────────────────────────────────
  const memberStats = { count: memberStatData?.length || 0 }
  const activeMembers = { count: memberStatData?.filter(m => m.status === 'active').length || 0 }
  const suspendedMembers = { count: memberStatData?.filter(m => m.status === 'suspended').length || 0 }
  const exitedMembers = { count: memberStatData?.filter(m => m.status === 'exited').length || 0 }

  // ─── Fine Stats ───────────────────────────────────────────────────────────
  const fineStats = {
    total: fineStatData?.reduce((sum, fine) => sum + fine.amount, 0) || 0,
    count: fineStatData?.length || 0,
  }
  const pendingFines = {
    total: fineStatData?.filter(f => f.status === 'pending').reduce((sum, fine) => sum + fine.amount, 0) || 0,
    count: fineStatData?.filter(f => f.status === 'pending').length || 0,
  }
  const paidFines = {
    total: fineStatData?.filter(f => f.status === 'paid').reduce((sum, fine) => sum + fine.amount, 0) || 0,
    count: fineStatData?.filter(f => f.status === 'paid').length || 0,
  }
  const waivedFines = {
    total: fineStatData?.filter(f => f.status === 'waived').reduce((sum, fine) => sum + fine.amount, 0) || 0,
    count: fineStatData?.filter(f => f.status === 'waived').length || 0,
  }

  // ─── Transaction Stats ────────────────────────────────────────────────────
  const totalDeposits = { total: transactionStatData?.filter(t => t.type === 'savings_deposit').reduce((sum, t) => sum + t.amount, 0) || 0 }
  const totalWithdrawals = { total: transactionStatData?.filter(t => t.type === 'savings_withdrawal').reduce((sum, t) => sum + t.amount, 0) || 0 }
  const totalRepayments = { total: transactionStatData?.filter(t => t.type === 'loan_repayment').reduce((sum, t) => sum + t.amount, 0) || 0 }

  // ─── Complaint Stats ──────────────────────────────────────────────────────
  const complaintStats = { count: complaintStatData?.length || 0 }
  const openComplaints = { count: complaintStatData?.filter(c => c.status === 'open').length || 0 }
  const resolvedComplaints = { count: complaintStatData?.filter(c => c.status === 'resolved').length || 0 }

  // ─── Notification Stats ───────────────────────────────────────────────────
  const notificationStats = { count: notificationStatData?.length || 0 }
  const sentNotifications = { count: notificationStatData?.filter(n => n.status === 'sent').length || 0 }
  const failedNotifications = { count: notificationStatData?.filter(n => n.status === 'failed').length || 0 }

  // ─── Format Detail Data ───────────────────────────────────────────────────
  const formattedAllLoans = (allLoans as any[])?.map(loan => ({
    id: loan.id,
    loan_ref: loan.loan_ref,
    amount: loan.amount,
    expectedReceived: loan.expected_received,
    balance: loan.balance,
    interest_rate: loan.interest_rate,
    interest_type: loan.interest_type,
    duration_months: loan.duration_months,
    daily_payment: loan.daily_payment,
    monthly_payment: loan.monthly_payment,
    late_penalty_fee: loan.late_penalty_fee,
    status: loan.status,
    due_date: loan.due_date,
    createdAt: loan.created_at,
    disbursed_at: loan.disbursed_at,
    settled_at: loan.settled_at,
    notes: loan.notes,
    memberId: loan.member_id,
    member_name: loan.members?.full_name,
    member_code: loan.members?.member_code,
    member_phone: loan.members?.phone,
    category_name: loan.loan_categories?.name,
  })) || []

  const allSavings = (allSavingsData as any[])?.map(saving => ({
    id: saving.id,
    account_number: saving.account_number,
    balance: saving.balance,
    account_type: saving.account_type,
    is_locked: saving.is_locked,
    lock_until: saving.lock_until,
    createdAt: saving.created_at,
    memberId: saving.member_id,
    member_name: saving.members?.full_name,
    member_code: saving.members?.member_code,
    member_phone: saving.members?.phone,
    category_name: saving.savings_categories?.name,
  })) || []

  const formattedAllMembers = (allMembers as any[])?.map(member => ({
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
    joinedAt: new Date(member.joined_at),
    createdAt: new Date(member.created_at),
    updatedAt: new Date(member.updated_at),
  })) || []

  const allFines = (allFinesData as any[])?.map(fine => ({
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
    createdAt: fine.created_at,
    memberId: fine.member_id,
    member_name: fine.members?.full_name,
    member_code: fine.members?.member_code,
    category_name: fine.fine_categories?.name,
  })) || []

  const allTransactions = (allTransactionsData as any[])?.map(tx => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    balance_after: tx.balance_after,
    payment_method: tx.payment_method,
    narration: tx.narration,
    createdAt: tx.created_at,
    memberId: tx.member_id,
    member_name: tx.members?.full_name,
    member_code: tx.members?.member_code,
  })) || []

  const allComplaints = (allComplaintsData as any[])?.map(complaint => ({
    id: complaint.id,
    complaint_ref: complaint.complaint_ref,
    subject: complaint.subject,
    body: complaint.body,
    category: complaint.category,
    priority: complaint.priority,
    status: complaint.status,
    resolution_notes: complaint.resolution_notes,
    satisfaction_rating: complaint.satisfaction_rating,
    feedback: complaint.feedback,
    createdAt: complaint.created_at,
    resolved_at: complaint.resolved_at,
    memberId: complaint.member_id,
    member_name: complaint.members?.full_name,
    member_code: complaint.members?.member_code,
    member_phone: complaint.members?.phone,
  })) || []

  const allNotifications = (allNotificationsData as any[])?.map(notification => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    status: notification.status,
    priority: notification.priority,
    channel: notification.channel,
    scheduled_at: notification.scheduled_at,
    sent_at: notification.sent_at,
    delivered_at: notification.delivered_at,
    read_at: notification.read_at,
    createdAt: notification.created_at,
    memberId: notification.member_id,
    member_name: notification.members?.full_name,
    member_code: notification.members?.member_code,
  })) || []

  return (
    <ReportsClient
      sacco={sacco}
      stats={{
        // Loans
        totalLoansAmount: Number(loanStats?.total ?? 0),
        totalExpectedAmount: Number(loanStats?.totalExpected ?? 0),
        totalLoansCount: loanStats?.count ?? 0,
        activeLoansAmount: Number(activeLoans?.total ?? 0),
        activeLoansCount: activeLoans?.count ?? 0,
        disbursedLoansAmount: Number(disbursedLoans?.total ?? 0),
        disbursedLoansCount: disbursedLoans?.count ?? 0,
        approvedLoansCount: approvedLoans?.count ?? 0,
        pendingLoansCount: pendingLoans?.count ?? 0,
        settledLoansCount: settledLoans?.count ?? 0,
        defaultedLoansCount: defaultedLoans?.count ?? 0,

        // Savings
        totalSavings: Number(savingsStats?.total ?? 0),
        savingsCount: savingsStats?.count ?? 0,
        fixedSavingsAmount: Number(fixedSavings?.total ?? 0),
        fixedSavingsCount: fixedSavings?.count ?? 0,
        lockedSavingsCount: lockedSavings?.count ?? 0,

        // Members
        totalMembers: memberStats?.count ?? 0,
        activeMembers: activeMembers?.count ?? 0,
        suspendedMembers: suspendedMembers?.count ?? 0,
        exitedMembers: exitedMembers?.count ?? 0,

        // Fines
        totalFines: Number(fineStats?.total ?? 0),
        finesCount: fineStats?.count ?? 0,
        pendingFinesAmount: Number(pendingFines?.total ?? 0),
        pendingFinesCount: pendingFines?.count ?? 0,
        paidFinesAmount: Number(paidFines?.total ?? 0),
        paidFinesCount: paidFines?.count ?? 0,
        waivedFinesAmount: Number(waivedFines?.total ?? 0),
        waivedFinesCount: waivedFines?.count ?? 0,

        // Transactions
        totalDeposits: Number(totalDeposits?.total ?? 0),
        totalWithdrawals: Number(totalWithdrawals?.total ?? 0),
        totalRepayments: Number(totalRepayments?.total ?? 0),

        // Complaints
        totalComplaints: complaintStats?.count ?? 0,
        openComplaints: openComplaints?.count ?? 0,
        resolvedComplaints: resolvedComplaints?.count ?? 0,

        // Notifications
        totalNotifications: notificationStats?.count ?? 0,
        sentNotifications: sentNotifications?.count ?? 0,
        failedNotifications: failedNotifications?.count ?? 0,
      }}
      loans={formattedAllLoans}
      savings={allSavings}
      members={formattedAllMembers}
      fines={allFines}
      transactions={allTransactions}
      complaints={allComplaints}
      notifications={allNotifications}
      interestRates={interestRatesList || []}
      loanCategories={loanCategoriesList || []}
      savingsCategories={savingsCategoriesList || []}
      fineCategories={fineCategoriesList || []}
    />
  )
}

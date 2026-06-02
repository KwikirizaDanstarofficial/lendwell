import { requireAuth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { getSaccoSettings } from "@/db/queries/settings"
import { ReportsClient } from "./components/reports-client"

export const revalidate = 60

export default async function ReportsPage() {
  const user = await requireAuth()
  const supabase = supabaseAdmin

  // Declare all data with safe defaults — filled in below when online.
  let loanStatData: any[] = []
  let savingsStatData: any[] = []
  let memberStatData: any[] = []
  let fineStatData: any[] = []
  let transactionStatData: any[] = []
  let complaintStatData: any[] = []
  let notificationStatData: any[] = []
  let allLoans: any[] = []
  let allSavingsData: any[] = []
  let allMembers: any[] = []
  let allFinesData: any[] = []
  let allTransactionsData: any[] = []
  let allComplaintsData: any[] = []
  let allNotificationsData: any[] = []
  let interestRatesList: any[] = []
  let loanCategoriesList: any[] = []
  let savingsCategoriesList: any[] = []
  let fineCategoriesList: any[] = []
  let sacco: any = null

  try {
    const results = await Promise.all([
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

    loanStatData         = results[0].data  ?? []
    savingsStatData      = results[1].data  ?? []
    memberStatData       = results[2].data  ?? []
    fineStatData         = results[3].data  ?? []
    transactionStatData  = results[4].data  ?? []
    complaintStatData    = results[5].data  ?? []
    notificationStatData = results[6].data  ?? []
    allLoans             = results[7].data  ?? []
    allSavingsData       = results[8].data  ?? []
    allMembers           = results[9].data  ?? []
    allFinesData         = results[10].data ?? []
    allTransactionsData  = results[11].data ?? []
    allComplaintsData    = results[12].data ?? []
    allNotificationsData = results[13].data ?? []
    interestRatesList    = results[14].data ?? []
    loanCategoriesList   = results[15].data ?? []
    savingsCategoriesList= results[16].data ?? []
    fineCategoriesList   = results[17].data ?? []
    sacco                = results[18]
  } catch {
    // Offline — render with empty data (all defaults above)
  }

  // ─── Loan Stats ───────────────────────────────────────────────────────────
  const loanStats = {
    total: loanStatData.reduce((sum, loan) => sum + loan.amount, 0),
    count: loanStatData.length,
    totalExpected: loanStatData.reduce((sum, loan) => sum + loan.expected_received, 0),
  }
  const activeLoans = {
    total: loanStatData.filter(l => l.status === 'active').reduce((sum, loan) => sum + loan.balance, 0),
    count: loanStatData.filter(l => l.status === 'active').length,
  }
  const disbursedLoans = {
    total: loanStatData.filter(l => l.status === 'disbursed').reduce((sum, loan) => sum + loan.amount, 0),
    count: loanStatData.filter(l => l.status === 'disbursed').length,
  }
  const approvedLoans  = { count: loanStatData.filter(l => l.status === 'approved').length }
  const pendingLoans   = { count: loanStatData.filter(l => l.status === 'pending').length }
  const settledLoans   = { count: loanStatData.filter(l => l.status === 'settled').length }
  const defaultedLoans = { count: loanStatData.filter(l => l.status === 'defaulted').length }

  // ─── Savings Stats ────────────────────────────────────────────────────────
  const savingsStats = {
    total: savingsStatData.reduce((sum, account) => sum + account.balance, 0),
    count: savingsStatData.length,
  }
  const fixedSavings = {
    total: savingsStatData.filter(s => s.account_type === 'fixed').reduce((sum, a) => sum + a.balance, 0),
    count: savingsStatData.filter(s => s.account_type === 'fixed').length,
  }
  const lockedSavings = { count: savingsStatData.filter(s => s.is_locked).length }

  // ─── Member Stats ─────────────────────────────────────────────────────────
  const memberStats      = { count: memberStatData.length }
  const activeMembers    = { count: memberStatData.filter(m => m.status === 'active').length }
  const suspendedMembers = { count: memberStatData.filter(m => m.status === 'suspended').length }
  const exitedMembers    = { count: memberStatData.filter(m => m.status === 'exited').length }

  // ─── Fine Stats ───────────────────────────────────────────────────────────
  const fineStats = {
    total: fineStatData.reduce((sum, fine) => sum + fine.amount, 0),
    count: fineStatData.length,
  }
  const pendingFines = {
    total: fineStatData.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0),
    count: fineStatData.filter(f => f.status === 'pending').length,
  }
  const paidFines = {
    total: fineStatData.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0),
    count: fineStatData.filter(f => f.status === 'paid').length,
  }
  const waivedFines = {
    total: fineStatData.filter(f => f.status === 'waived').reduce((sum, f) => sum + f.amount, 0),
    count: fineStatData.filter(f => f.status === 'waived').length,
  }

  // ─── Transaction Stats ────────────────────────────────────────────────────
  const totalDeposits    = { total: transactionStatData.filter(t => t.type === 'savings_deposit').reduce((sum, t) => sum + t.amount, 0) }
  const totalWithdrawals = { total: transactionStatData.filter(t => t.type === 'savings_withdrawal').reduce((sum, t) => sum + t.amount, 0) }
  const totalRepayments  = { total: transactionStatData.filter(t => t.type === 'loan_repayment').reduce((sum, t) => sum + t.amount, 0) }

  // ─── Complaint Stats ──────────────────────────────────────────────────────
  const complaintStats     = { count: complaintStatData.length }
  const openComplaints     = { count: complaintStatData.filter(c => c.status === 'open').length }
  const resolvedComplaints = { count: complaintStatData.filter(c => c.status === 'resolved').length }

  // ─── Notification Stats ───────────────────────────────────────────────────
  const notificationStats  = { count: notificationStatData.length }
  const sentNotifications  = { count: notificationStatData.filter(n => n.status === 'sent').length }
  const failedNotifications= { count: notificationStatData.filter(n => n.status === 'failed').length }

  // ─── Format Detail Data ───────────────────────────────────────────────────
  const formattedAllLoans = allLoans.map((loan: any) => ({
    id: loan.id, loan_ref: loan.loan_ref, amount: loan.amount,
    expectedReceived: loan.expected_received, balance: loan.balance,
    interest_rate: loan.interest_rate, interest_type: loan.interest_type,
    duration_months: loan.duration_months, daily_payment: loan.daily_payment,
    monthly_payment: loan.monthly_payment, late_penalty_fee: loan.late_penalty_fee,
    status: loan.status, due_date: loan.due_date, createdAt: loan.created_at,
    disbursed_at: loan.disbursed_at, settled_at: loan.settled_at, notes: loan.notes,
    memberId: loan.member_id, member_name: loan.members?.full_name,
    member_code: loan.members?.member_code, member_phone: loan.members?.phone,
    category_name: loan.loan_categories?.name,
  }))

  const allSavings = allSavingsData.map((saving: any) => ({
    id: saving.id, account_number: saving.account_number, balance: saving.balance,
    account_type: saving.account_type, is_locked: saving.is_locked,
    lock_until: saving.lock_until, createdAt: saving.created_at, memberId: saving.member_id,
    member_name: saving.members?.full_name, member_code: saving.members?.member_code,
    member_phone: saving.members?.phone, category_name: saving.savings_categories?.name,
  }))

  const formattedAllMembers = allMembers.map((member: any) => ({
    id: member.id, saccoId: member.sacco_id, memberCode: member.member_code,
    fullName: member.full_name, email: member.email, phone: member.phone,
    nationalId: member.national_id, photoUrl: member.photo_url,
    dateOfBirth: member.date_of_birth, address: member.address,
    nextOfKin: member.next_of_kin, nextOfKinPhone: member.next_of_kin_phone,
    nextOfKinRelationship: member.next_of_kin_relationship,
    nextOfKinAddress: member.next_of_kin_address, status: member.status,
    joinedAt: new Date(member.joined_at), createdAt: new Date(member.created_at),
    updatedAt: new Date(member.updated_at),
  }))

  const allFines = allFinesData.map((fine: any) => ({
    id: fine.id, fine_ref: fine.fine_ref, amount: fine.amount, reason: fine.reason,
    description: fine.description, status: fine.status, priority: fine.priority,
    due_date: fine.due_date, paid_at: fine.paid_at, payment_method: fine.payment_method,
    payment_reference: fine.payment_reference, notes: fine.notes, createdAt: fine.created_at,
    memberId: fine.member_id, member_name: fine.members?.full_name,
    member_code: fine.members?.member_code, category_name: fine.fine_categories?.name,
  }))

  const allTransactions = allTransactionsData.map((tx: any) => ({
    id: tx.id, type: tx.type, amount: tx.amount, balance_after: tx.balance_after,
    payment_method: tx.payment_method, narration: tx.narration, createdAt: tx.created_at,
    memberId: tx.member_id, member_name: tx.members?.full_name, member_code: tx.members?.member_code,
  }))

  const allComplaints = allComplaintsData.map((complaint: any) => ({
    id: complaint.id, complaint_ref: complaint.complaint_ref, subject: complaint.subject,
    body: complaint.body, category: complaint.category, priority: complaint.priority,
    status: complaint.status, resolution_notes: complaint.resolution_notes,
    satisfaction_rating: complaint.satisfaction_rating, feedback: complaint.feedback,
    createdAt: complaint.created_at, resolved_at: complaint.resolved_at,
    memberId: complaint.member_id, member_name: complaint.members?.full_name,
    member_code: complaint.members?.member_code, member_phone: complaint.members?.phone,
  }))

  const allNotifications = allNotificationsData.map((notification: any) => ({
    id: notification.id, title: notification.title, body: notification.body,
    type: notification.type, status: notification.status, priority: notification.priority,
    channel: notification.channel, scheduled_at: notification.scheduled_at,
    sent_at: notification.sent_at, delivered_at: notification.delivered_at,
    read_at: notification.read_at, createdAt: notification.created_at,
    memberId: notification.member_id, member_name: notification.members?.full_name,
    member_code: notification.members?.member_code,
  }))

  return (
    <ReportsClient
      sacco={sacco}
      stats={{
        totalLoansAmount: Number(loanStats.total),
        totalExpectedAmount: Number(loanStats.totalExpected),
        totalLoansCount: loanStats.count,
        activeLoansAmount: Number(activeLoans.total),
        activeLoansCount: activeLoans.count,
        disbursedLoansAmount: Number(disbursedLoans.total),
        disbursedLoansCount: disbursedLoans.count,
        approvedLoansCount: approvedLoans.count,
        pendingLoansCount: pendingLoans.count,
        settledLoansCount: settledLoans.count,
        defaultedLoansCount: defaultedLoans.count,
        totalSavings: Number(savingsStats.total),
        savingsCount: savingsStats.count,
        fixedSavingsAmount: Number(fixedSavings.total),
        fixedSavingsCount: fixedSavings.count,
        lockedSavingsCount: lockedSavings.count,
        totalMembers: memberStats.count,
        activeMembers: activeMembers.count,
        suspendedMembers: suspendedMembers.count,
        exitedMembers: exitedMembers.count,
        totalFines: Number(fineStats.total),
        finesCount: fineStats.count,
        pendingFinesAmount: Number(pendingFines.total),
        pendingFinesCount: pendingFines.count,
        paidFinesAmount: Number(paidFines.total),
        paidFinesCount: paidFines.count,
        waivedFinesAmount: Number(waivedFines.total),
        waivedFinesCount: waivedFines.count,
        totalDeposits: Number(totalDeposits.total),
        totalWithdrawals: Number(totalWithdrawals.total),
        totalRepayments: Number(totalRepayments.total),
        totalComplaints: complaintStats.count,
        openComplaints: openComplaints.count,
        resolvedComplaints: resolvedComplaints.count,
        totalNotifications: notificationStats.count,
        sentNotifications: sentNotifications.count,
        failedNotifications: failedNotifications.count,
      }}
      loans={formattedAllLoans}
      savings={allSavings}
      members={formattedAllMembers}
      fines={allFines}
      transactions={allTransactions}
      complaints={allComplaints}
      notifications={allNotifications}
      interestRates={interestRatesList}
      loanCategories={loanCategoriesList}
      savingsCategories={savingsCategoriesList}
      fineCategories={fineCategoriesList}
    />
  )
}

"use client"

/**
 * Offline-safe mutation helpers.
 * When offline, writes go directly to the local PowerSync SQLite database.
 * PowerSync's uploadData connector syncs them to Supabase when back online.
 */

import { AbstractPowerSyncDatabase } from "@powersync/web"

function now() { return new Date().toISOString() }
function uuid() { return crypto.randomUUID() }

// ─── Members ─────────────────────────────────────────────────────────────────

const MEMBER_CODE_PREFIX = "MBR"
const SACCO_SHORT_ID_LENGTH = 4
const SEQUENCE_PAD_WIDTH = 5

function buildCodePrefix(saccoId: string): string {
  const year = new Date().getFullYear()
  const saccoShort = saccoId.slice(0, SACCO_SHORT_ID_LENGTH).toUpperCase()
  return `${MEMBER_CODE_PREFIX}-${year}-${saccoShort}-`
}

export async function offlineAddMember(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    full_name: string
    email?: string | null
    phone: string
    national_id?: string | null
    date_of_birth?: string | null
    address?: string | null
    next_of_kin?: string | null
    next_of_kin_phone?: string | null
    next_of_kin_relationship?: string | null
    next_of_kin_address?: string | null
    status?: string
  }
): Promise<string> {
  const id = uuid()
  const prefix = buildCodePrefix(saccoId)
  const result = await db.execute(
    "SELECT member_code FROM members WHERE sacco_id = ? AND member_code LIKE ? ORDER BY member_code DESC LIMIT 1",
    [saccoId, `${prefix}%`]
  )
  let nextSeq = 1
  const row = result.rows?.item(0) as any
  if (row?.member_code) {
    const lastSeq = parseInt(row.member_code.slice(prefix.length), 10) || 0
    nextSeq = lastSeq + 1
  }
  const member_code = `${prefix}${String(nextSeq).padStart(SEQUENCE_PAD_WIDTH, "0")}-${uuid().slice(0, 4).toUpperCase()}`
  const ts = now()

  await db.execute(
    `INSERT INTO members
       (id, sacco_id, member_code, full_name, email, phone, national_id,
        date_of_birth, address, next_of_kin, next_of_kin_phone,
        next_of_kin_relationship, next_of_kin_address, status,
        created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, saccoId, member_code, data.full_name,
      data.email ?? null, data.phone, data.national_id ?? null,
      data.date_of_birth ?? null, data.address ?? null,
      data.next_of_kin ?? null, data.next_of_kin_phone ?? null,
      data.next_of_kin_relationship ?? null, data.next_of_kin_address ?? null,
      data.status ?? "active", ts, ts,
    ]
  )
  return id
}

export async function offlineEditMember(
  db: AbstractPowerSyncDatabase,
  id: string,
  data: Partial<{
    full_name: string
    email: string | null
    phone: string
    national_id: string | null
    date_of_birth: string | null
    address: string | null
    next_of_kin: string | null
    next_of_kin_phone: string | null
    next_of_kin_relationship: string | null
    next_of_kin_address: string | null
    status: string
  }>
): Promise<void> {
  const fields = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = ?`)
    .join(", ")
  const values = Object.values(data).filter((v) => v !== undefined)
  await db.execute(
    `UPDATE members SET ${fields}, updated_at = ? WHERE id = ?`,
    [...values, now(), id]
  )
}

export async function offlineDeleteMember(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM members WHERE id = ?", [id])
}

export async function offlineUpdateMemberStatus(
  db: AbstractPowerSyncDatabase,
  id: string,
  status: string
): Promise<void> {
  await db.execute(
    "UPDATE members SET status = ?, updated_at = ? WHERE id = ?",
    [status, now(), id]
  )
}

// ─── Loans ───────────────────────────────────────────────────────────────────

export async function offlineAddLoan(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    member_id: string
    amount: number
    interest_rate: string
    interest_type: string
    duration_months: number
    due_date?: string | null
    notes?: string | null
    category_id?: string | null
    expected_received?: number
    daily_payment?: number
    monthly_payment?: number
    late_penalty_fee?: number
  }
): Promise<string> {
  const id = uuid()
  const loan_ref = `LN-${Date.now()}`
  const ts = now()

  await db.execute(
    `INSERT INTO loans
       (id, sacco_id, member_id, loan_ref, amount, balance, interest_rate,
        interest_type, duration_months, status, due_date, notes, category_id,
        expected_received, daily_payment, monthly_payment, late_penalty_fee,
        created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, saccoId, data.member_id, loan_ref,
      data.amount, data.amount,
      data.interest_rate, data.interest_type, data.duration_months,
      "pending",
      data.due_date ?? null, data.notes ?? null, data.category_id ?? null,
      data.expected_received ?? data.amount, data.daily_payment ?? 0,
      data.monthly_payment ?? 0, data.late_penalty_fee ?? 0,
      ts, ts,
    ]
  )
  return id
}

export async function offlineRepayLoan(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  loanId: string,
  memberId: string,
  amount: number,
  paymentDate?: string
): Promise<void> {
  const txId = uuid()
  const ts = paymentDate ? new Date(paymentDate).toISOString() : now()

  await db.execute(
    "UPDATE loans SET balance = MAX(0, balance - ?), updated_at = ? WHERE id = ?",
    [amount, now(), loanId]
  )

  const loanResult = await db.execute(
    "SELECT balance FROM loans WHERE id = ?",
    [loanId]
  )
  const newBalance = Number((loanResult.rows?.item(0) as any)?.balance ?? 0)
  if (newBalance === 0) {
    await db.execute(
      "UPDATE loans SET status = 'settled', settled_at = ?, updated_at = ? WHERE id = ?",
      [ts, ts, loanId]
    )
  }

  await db.execute(
    `INSERT INTO transactions
       (id, sacco_id, member_id, type, amount, balance_after, reference_id,
        narration, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [txId, saccoId, memberId, "loan_repayment", amount, newBalance, loanId,
     "Loan repayment", ts]
  )
}

export async function offlineEditLoan(
  db: AbstractPowerSyncDatabase,
  id: string,
  data: {
    amount?: number
    balance?: number
    duration_months?: number
    due_date?: string | null
    notes?: string | null
    interest_rate?: string
    interest_type?: string
    expected_received?: number
    daily_payment?: number
    monthly_payment?: number
    late_penalty_fee?: number
    status?: string
  }
): Promise<void> {
  const fields = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = ?`)
    .join(", ")
  const values = Object.values(data).filter((v) => v !== undefined)
  await db.execute(
    `UPDATE loans SET ${fields}, updated_at = ? WHERE id = ?`,
    [...values, now(), id]
  )
}

export async function offlineDeleteLoan(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM loans WHERE id = ?", [id])
}

export async function offlineTopUpLoan(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  loanId: string,
  memberId: string,
  amount: number,
  reason?: string
): Promise<void> {
  const ts = now()
  await db.execute(
    "UPDATE loans SET balance = balance + ?, updated_at = ? WHERE id = ?",
    [amount, ts, loanId]
  )
  const result = await db.execute(
    "SELECT balance FROM loans WHERE id = ?", [loanId]
  )
  const newBalance = Number((result.rows?.item(0) as any)?.balance ?? 0)
  await db.execute(
    `INSERT INTO transactions
       (id, sacco_id, member_id, type, amount, balance_after, reference_id,
        narration, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [uuid(), saccoId, memberId, "loan_disbursement", amount, newBalance, loanId,
     `Loan top-up${reason ? ` - ${reason}` : ""}`, ts]
  )
}

// ─── Savings ─────────────────────────────────────────────────────────────────

export async function offlineCreateSavingsAccount(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    member_id: string
    category_id: string | null
    account_type?: string
    initial_deposit?: number
  }
): Promise<string> {
  const id = uuid()
  const account_number = `SAV-${Date.now()}`
  const ts = now()
  const initial = (data.initial_deposit ?? 0) * 100

  await db.execute(
    `INSERT INTO savings_accounts
       (id, sacco_id, member_id, category_id, account_number, balance,
        account_type, is_locked, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, saccoId, data.member_id, data.category_id || null, account_number,
     initial, data.account_type ?? "regular", 0, ts, ts]
  )

  if (initial > 0) {
    await db.execute(
      `INSERT INTO transactions
         (id, sacco_id, member_id, type, amount, balance_after, reference_id,
          narration, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [uuid(), saccoId, data.member_id, "savings_deposit", initial, initial,
       id, "Initial deposit", ts]
    )
  }
  return id
}

export async function offlineDeposit(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  accountId: string,
  memberId: string,
  amount: number,
  narration?: string
): Promise<void> {
  const ts = now()
  await db.execute(
    "UPDATE savings_accounts SET balance = balance + ?, updated_at = ? WHERE id = ?",
    [amount, ts, accountId]
  )
  const result = await db.execute(
    "SELECT balance FROM savings_accounts WHERE id = ?", [accountId]
  )
  const newBalance = Number((result.rows?.item(0) as any)?.balance ?? 0)
  await db.execute(
    `INSERT INTO transactions
       (id, sacco_id, member_id, type, amount, balance_after, reference_id,
        narration, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [uuid(), saccoId, memberId, "savings_deposit", amount, newBalance,
     accountId, narration ?? "Deposit", ts]
  )
}

export async function offlineWithdraw(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  accountId: string,
  memberId: string,
  amount: number,
  narration?: string
): Promise<void> {
  const ts = now()
  await db.execute(
    "UPDATE savings_accounts SET balance = MAX(0, balance - ?), updated_at = ? WHERE id = ?",
    [amount, ts, accountId]
  )
  const result = await db.execute(
    "SELECT balance FROM savings_accounts WHERE id = ?", [accountId]
  )
  const newBalance = Number((result.rows?.item(0) as any)?.balance ?? 0)
  await db.execute(
    `INSERT INTO transactions
       (id, sacco_id, member_id, type, amount, balance_after, reference_id,
        narration, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [uuid(), saccoId, memberId, "savings_withdrawal", amount, newBalance,
     accountId, narration ?? "Withdrawal", ts]
  )
}

// ─── Fines ───────────────────────────────────────────────────────────────────

export async function offlineAddFine(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    member_id: string
    category_id?: string | null
    amount: number
    reason: string
    due_date?: string | null
    notes?: string | null
  }
): Promise<string> {
  const id = uuid()
  const result = await db.execute(
    "SELECT COUNT(*) as count FROM fines WHERE sacco_id = ?", [saccoId]
  )
  const count = Number((result.rows?.item(0) as any)?.count ?? 0)
  const fine_ref = `FN${String(count + 1).padStart(4, "0")}-${uuid().slice(0, 4).toUpperCase()}`
  const ts = now()

  await db.execute(
    `INSERT INTO fines
       (id, sacco_id, member_id, category_id, fine_ref, amount, reason,
        status, due_date, notes, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, saccoId, data.member_id, data.category_id ?? null, fine_ref,
     data.amount, data.reason, "pending",
     data.due_date ?? null, data.notes ?? null, ts, ts]
  )
  return id
}

export async function offlineMarkFinePaid(
  db: AbstractPowerSyncDatabase,
  id: string,
  payment_method?: string
): Promise<void> {
  await db.execute(
    `UPDATE fines SET status = 'paid', paid_at = ?, payment_method = ?,
     updated_at = ? WHERE id = ?`,
    [now(), payment_method ?? null, now(), id]
  )
}

export async function offlineWaiveFine(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute(
    "UPDATE fines SET status = 'waived', updated_at = ? WHERE id = ?",
    [now(), id]
  )
}

export async function offlineDeleteFine(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM fines WHERE id = ?", [id])
}

export async function offlineTrimToLoan(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  accountId: string,
  memberId: string,
  loanId: string,
  amount: number
): Promise<void> {
  const ts = now()
  await db.execute(
    "UPDATE savings_accounts SET balance = MAX(0, balance - ?), updated_at = ? WHERE id = ?",
    [amount, ts, accountId]
  )
  const savingsResult = await db.execute(
    "SELECT balance FROM savings_accounts WHERE id = ?", [accountId]
  )
  const newSavingsBalance = Number((savingsResult.rows?.item(0) as any)?.balance ?? 0)
  await db.execute(
    "UPDATE loans SET balance = MAX(0, balance - ?), updated_at = ? WHERE id = ?",
    [amount, ts, loanId]
  )
  const loanResult = await db.execute(
    "SELECT balance FROM loans WHERE id = ?", [loanId]
  )
  const newLoanBalance = Number((loanResult.rows?.item(0) as any)?.balance ?? 0)
  if (newLoanBalance === 0) {
    await db.execute(
      "UPDATE loans SET status = 'settled', settled_at = ?, updated_at = ? WHERE id = ?",
      [ts, ts, loanId]
    )
  }
  await db.execute(
    `INSERT INTO transactions
       (id, sacco_id, member_id, type, amount, balance_after, reference_id,
        narration, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [uuid(), saccoId, memberId, "loan_repayment", amount, newSavingsBalance, loanId,
     "Loan repayment from savings", ts]
  )
}

// ─── Savings account management ──────────────────────────────────────────────

export async function offlineLockAccount(
  db: AbstractPowerSyncDatabase,
  id: string,
  lockUntil?: string | null,
  lockReason?: string | null
): Promise<void> {
  await db.execute(
    "UPDATE savings_accounts SET is_locked = 1, lock_until = ?, lock_reason = ?, updated_at = ? WHERE id = ?",
    [lockUntil ?? null, lockReason ?? null, now(), id]
  )
}

export async function offlineUnlockAccount(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute(
    "UPDATE savings_accounts SET is_locked = 0, lock_until = NULL, lock_reason = NULL, updated_at = ? WHERE id = ?",
    [now(), id]
  )
}

export async function offlineDeleteSavingsAccount(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM savings_accounts WHERE id = ?", [id])
}

export async function offlineUpdateSavingsAccount(
  db: AbstractPowerSyncDatabase,
  id: string,
  data: {
    account_type?: string
    category_id?: string | null
  }
): Promise<void> {
  const fields: string[] = []
  const values: any[] = []
  if (data.account_type !== undefined) { fields.push("account_type = ?"); values.push(data.account_type) }
  if (data.category_id !== undefined) { fields.push("category_id = ?"); values.push(data.category_id) }
  if (fields.length === 0) return
  await db.execute(
    `UPDATE savings_accounts SET ${fields.join(", ")}, updated_at = ? WHERE id = ?`,
    [...values, now(), id]
  )
}

// ─── Complaints ───────────────────────────────────────────────────────────────

export async function offlineAddComplaint(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    member_id: string
    subject: string
    body: string
    category?: string | null
    priority?: string | null
  }
): Promise<string> {
  const id = uuid()
  const result = await db.execute(
    "SELECT COUNT(*) as count FROM complaints WHERE sacco_id = ?", [saccoId]
  )
  const count = Number((result.rows?.item(0) as any)?.count ?? 0)
  const complaint_ref = `CMP${String(count + 1).padStart(4, "0")}-${uuid().slice(0, 4).toUpperCase()}`
  const ts = now()

  await db.execute(
    `INSERT INTO complaints
       (id, sacco_id, member_id, complaint_ref, subject, body, category,
        priority, status, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, saccoId, data.member_id, complaint_ref, data.subject, data.body,
     data.category ?? null, data.priority ?? "normal", "open", ts, ts]
  )
  return id
}

export async function offlineUpdateComplaintStatus(
  db: AbstractPowerSyncDatabase,
  id: string,
  status: string
): Promise<void> {
  await db.execute(
    "UPDATE complaints SET status = ?, updated_at = ? WHERE id = ?",
    [status, now(), id]
  )
}

export async function offlineResolveComplaint(
  db: AbstractPowerSyncDatabase,
  id: string,
  resolution_notes: string
): Promise<void> {
  await db.execute(
    "UPDATE complaints SET status = 'resolved', resolution_notes = ?, resolved_at = ?, updated_at = ? WHERE id = ?",
    [resolution_notes, now(), now(), id]
  )
}

export async function offlineDeleteComplaint(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM complaints WHERE id = ?", [id])
}

// ─── Loan guarantors ─────────────────────────────────────────────────────────

export async function offlineAddGuarantor(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  loanId: string,
  memberId: string,
  notes?: string | null
): Promise<string> {
  const id = uuid()
  const ts = now()
  await db.execute(
    `INSERT INTO loan_guarantors (id, loan_id, member_id, sacco_id, status, notes, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?)`,
    [id, loanId, memberId, saccoId, "pending", notes ?? null, ts, ts]
  )
  return id
}

export async function offlineRemoveGuarantor(
  db: AbstractPowerSyncDatabase,
  guarantorId: string
): Promise<void> {
  await db.execute("DELETE FROM loan_guarantors WHERE id = ?", [guarantorId])
}

export async function offlineUpdateGuarantorStatus(
  db: AbstractPowerSyncDatabase,
  guarantorId: string,
  status: string,
  notes?: string | null
): Promise<void> {
  await db.execute(
    "UPDATE loan_guarantors SET status = ?, notes = ?, updated_at = ? WHERE id = ?",
    [status, notes ?? null, now(), guarantorId]
  )
}

// ─── Loan status updates ──────────────────────────────────────────────────────

export async function offlineApproveLoan(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute(
    "UPDATE loans SET status = 'approved', updated_at = ? WHERE id = ?",
    [now(), id]
  )
}

export async function offlineDisburseLoan(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute(
    "UPDATE loans SET status = 'active', disbursed_at = ?, updated_at = ? WHERE id = ?",
    [now(), now(), id]
  )
}

export async function offlineDeclineLoan(
  db: AbstractPowerSyncDatabase,
  id: string,
  reason: string
): Promise<void> {
  await db.execute(
    "UPDATE loans SET status = 'declined', decline_reason = ?, updated_at = ? WHERE id = ?",
    [reason, now(), id]
  )
}

export async function offlineMarkLoanAsActive(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute(
    "UPDATE loans SET status = 'active', updated_at = ? WHERE id = ?",
    [now(), id]
  )
}

// ─── Interest Rates ──────────────────────────────────────────────────────────

export async function offlineAddInterestRate(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    min_amount: number
    max_amount: number
    rate: string
    rate_type: string
    is_active?: number
  }
): Promise<string> {
  const id = uuid()
  const ts = now()
  await db.execute(
    `INSERT INTO interest_rates
       (id, sacco_id, min_amount, max_amount, rate, rate_type, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [id, saccoId, data.min_amount, data.max_amount, data.rate, data.rate_type,
     data.is_active ?? 1, ts, ts]
  )
  return id
}

export async function offlineUpdateInterestRate(
  db: AbstractPowerSyncDatabase,
  id: string,
  data: {
    min_amount?: number
    max_amount?: number
    rate?: string
    rate_type?: string
    is_active?: number
  }
): Promise<void> {
  const fields = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = ?`)
    .join(", ")
  const values = Object.values(data).filter((v) => v !== undefined)
  if (fields.length === 0) return
  await db.execute(
    `UPDATE interest_rates SET ${fields}, updated_at = ? WHERE id = ?`,
    [...values, now(), id]
  )
}

export async function offlineDeactivateInterestRate(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute(
    "UPDATE interest_rates SET is_active = 0, updated_at = ? WHERE id = ?",
    [now(), id]
  )
}

export async function offlineActivateInterestRate(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute(
    "UPDATE interest_rates SET is_active = 1, updated_at = ? WHERE id = ?",
    [now(), id]
  )
}

export async function offlineDeleteInterestRate(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM interest_rates WHERE id = ?", [id])
}

// ─── Loan Categories ─────────────────────────────────────────────────────────

export async function offlineAddLoanCategory(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    name: string
    description?: string | null
    min_amount?: number
    max_amount?: number
    interest_rate?: string | null
    max_duration_months?: number
    requires_guarantor?: number
    is_active?: number
  }
): Promise<string> {
  const id = uuid()
  const ts = now()
  await db.execute(
    `INSERT INTO loan_categories
       (id, sacco_id, name, description, min_amount, max_amount, interest_rate,
        max_duration_months, requires_guarantor, is_active, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, saccoId, data.name, data.description ?? null,
     data.min_amount ?? 0, data.max_amount ?? 0,
     data.interest_rate ?? null, data.max_duration_months ?? 0,
     data.requires_guarantor ?? 0, data.is_active ?? 1, ts]
  )
  return id
}

export async function offlineDeleteLoanCategory(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM loan_categories WHERE id = ?", [id])
}

// ─── Savings Categories ──────────────────────────────────────────────────────

export async function offlineAddSavingsCategory(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    name: string
    description?: string | null
    interest_rate?: string | null
    is_fixed?: number
    is_active?: number
  }
): Promise<string> {
  const id = uuid()
  const ts = now()
  await db.execute(
    `INSERT INTO savings_categories
       (id, sacco_id, name, description, interest_rate, is_fixed, is_active, created_at)
     VALUES (?,?,?,?,?,?,?,?)`,
    [id, saccoId, data.name, data.description ?? null,
     data.interest_rate ?? null, data.is_fixed ?? 0, data.is_active ?? 1, ts]
  )
  return id
}

export async function offlineDeleteSavingsCategory(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM savings_categories WHERE id = ?", [id])
}

// ─── Fine Categories ─────────────────────────────────────────────────────────

export async function offlineAddFineCategory(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    name: string
    default_amount?: number
  }
): Promise<string> {
  const id = uuid()
  const ts = now()
  await db.execute(
    `INSERT INTO fine_categories (id, sacco_id, name, default_amount, created_at)
     VALUES (?,?,?,?,?)`,
    [id, saccoId, data.name, data.default_amount ?? 0, ts]
  )
  return id
}

export async function offlineDeleteFineCategory(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM fine_categories WHERE id = ?", [id])
}

// ─── Branches ────────────────────────────────────────────────────────────────

export async function offlineCreateBranch(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    name: string
    code: string
    address?: string | null
    phone?: string | null
    email?: string | null
    manager_id?: string | null
    is_active?: number
  }
): Promise<string> {
  const id = uuid()
  const ts = now()
  await db.execute(
    `INSERT INTO branches
       (id, sacco_id, name, code, address, phone, email, manager_id, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, saccoId, data.name, data.code, data.address ?? null,
     data.phone ?? null, data.email ?? null, data.manager_id ?? null,
     data.is_active ?? 1, ts, ts]
  )
  return id
}

export async function offlineUpdateBranch(
  db: AbstractPowerSyncDatabase,
  id: string,
  data: {
    name?: string
    code?: string
    address?: string | null
    phone?: string | null
    email?: string | null
    manager_id?: string | null
    is_active?: number
  }
): Promise<void> {
  const fields = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = ?`)
    .join(", ")
  const values = Object.values(data).filter((v) => v !== undefined)
  if (fields.length === 0) return
  await db.execute(
    `UPDATE branches SET ${fields}, updated_at = ? WHERE id = ?`,
    [...values, now(), id]
  )
}

export async function offlineDeleteBranch(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM branches WHERE id = ?", [id])
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function offlineAddDocument(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    member_id: string
    type: string
    file_name: string
    blob_url: string
    loan_id?: string | null
  }
): Promise<string> {
  const id = uuid()
  const ts = now()
  await db.execute(
    `INSERT INTO documents
       (id, sacco_id, member_id, loan_id, type, file_name, blob_url, created_at)
     VALUES (?,?,?,?,?,?,?,?)`,
    [id, saccoId, data.member_id, data.loan_id ?? null,
     data.type, data.file_name, data.blob_url, ts]
  )
  return id
}

export async function offlineDeleteDocument(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM documents WHERE id = ?", [id])
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function offlineSendNotification(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    member_id: string
    title: string
    body: string
    type?: string
    priority?: string
    channel?: string
    recipient_phone?: string | null
    recipient_email?: string | null
    reference_type?: string | null
    reference_id?: string | null
    scheduled_at?: string | null
  }
): Promise<string> {
  const id = uuid()
  const ts = now()
  await db.execute(
    `INSERT INTO notifications
       (id, sacco_id, member_id, title, body, type, status, priority, channel,
        recipient_phone, recipient_email, reference_type, reference_id,
        scheduled_at, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, saccoId, data.member_id, data.title, data.body,
     data.type ?? "general", "pending", data.priority ?? "normal",
     data.channel ?? "in_app", data.recipient_phone ?? null,
     data.recipient_email ?? null, data.reference_type ?? null,
     data.reference_id ?? null, data.scheduled_at ?? null, ts, ts]
  )
  return id
}

export async function offlineMarkNotificationRead(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute(
    "UPDATE notifications SET status = 'read', read_at = ?, updated_at = ? WHERE id = ?",
    [now(), now(), id]
  )
}

export async function offlineDeleteNotification(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM notifications WHERE id = ?", [id])
}

// ─── Next of Kin ─────────────────────────────────────────────────────────────

export async function offlineAddNextOfKin(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    member_id: string
    full_name: string
    relationship?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    is_primary?: number
  }
): Promise<string> {
  const id = uuid()
  const ts = now()
  await db.execute(
    `INSERT INTO next_of_kin
       (id, sacco_id, member_id, full_name, relationship, phone, email, address, is_primary, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, saccoId, data.member_id, data.full_name, data.relationship ?? null,
     data.phone ?? null, data.email ?? null, data.address ?? null,
     data.is_primary ?? 0, ts, ts]
  )
  return id
}

export async function offlineUpdateNextOfKin(
  db: AbstractPowerSyncDatabase,
  id: string,
  data: {
    full_name?: string
    relationship?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    is_primary?: number
  }
): Promise<void> {
  const fields = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = ?`)
    .join(", ")
  const values = Object.values(data).filter((v) => v !== undefined)
  if (fields.length === 0) return
  await db.execute(
    `UPDATE next_of_kin SET ${fields}, updated_at = ? WHERE id = ?`,
    [...values, now(), id]
  )
}

export async function offlineDeleteNextOfKin(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM next_of_kin WHERE id = ?", [id])
}

// ─── Saccos ──────────────────────────────────────────────────────────────────

export async function offlineUpdateSacco(
  db: AbstractPowerSyncDatabase,
  id: string,
  data: {
    name?: string
    code?: string
    logo_url?: string | null
    primary_color?: string | null
    contact_email?: string | null
    contact_phone?: string | null
    address?: string | null
    settings?: string | null
    website?: string | null
    registration_number?: string | null
    tagline?: string | null
    country?: string | null
  }
): Promise<void> {
  const fields = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = ?`)
    .join(", ")
  const values = Object.values(data).filter((v) => v !== undefined)
  if (fields.length === 0) return
  await db.execute(
    `UPDATE saccos SET ${fields}, updated_at = ? WHERE id = ?`,
    [...values, now(), id]
  )
}

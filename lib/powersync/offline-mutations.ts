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
  const result = await db.execute(
    "SELECT COUNT(*) as count FROM members WHERE sacco_id = ?",
    [saccoId]
  )
  const count = Number((result.rows?.item(0) as any)?.count ?? 0)
  const member_code = `M${String(count + 1).padStart(4, "0")}`
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
  const result = await db.execute(
    "SELECT COUNT(*) as count FROM loans WHERE sacco_id = ?",
    [saccoId]
  )
  const count = Number((result.rows?.item(0) as any)?.count ?? 0)
  const loan_ref = `LN${String(count + 1).padStart(5, "0")}`
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
  amount: number
): Promise<void> {
  const txId = uuid()
  const ts = now()

  await db.execute(
    "UPDATE loans SET balance = MAX(0, balance - ?), updated_at = ? WHERE id = ?",
    [amount, ts, loanId]
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

export async function offlineDeleteLoan(
  db: AbstractPowerSyncDatabase,
  id: string
): Promise<void> {
  await db.execute("DELETE FROM loans WHERE id = ?", [id])
}

// ─── Savings ─────────────────────────────────────────────────────────────────

export async function offlineCreateSavingsAccount(
  db: AbstractPowerSyncDatabase,
  saccoId: string,
  data: {
    member_id: string
    category_id: string
    account_type?: string
    initial_deposit?: number
  }
): Promise<string> {
  const id = uuid()
  const result = await db.execute(
    "SELECT COUNT(*) as count FROM savings_accounts WHERE sacco_id = ?",
    [saccoId]
  )
  const count = Number((result.rows?.item(0) as any)?.count ?? 0)
  const account_number = `SAV${String(count + 1).padStart(5, "0")}`
  const ts = now()
  const initial = data.initial_deposit ?? 0

  await db.execute(
    `INSERT INTO savings_accounts
       (id, sacco_id, member_id, category_id, account_number, balance,
        account_type, is_locked, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, saccoId, data.member_id, data.category_id, account_number,
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
  const fine_ref = `FN${String(count + 1).padStart(4, "0")}`
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
  const complaint_ref = `CMP${String(count + 1).padStart(4, "0")}`
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

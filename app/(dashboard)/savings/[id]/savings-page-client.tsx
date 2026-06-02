"use client"
import { useQuery } from "@powersync/react"
import { SavingsDetailClient } from "./savings-detail-client"

export function SavingsPageClient({
  id,
  initialAccount,
  initialTransactions = [],
}: {
  id: string
  initialAccount?: any
  initialTransactions?: any[]
}) {
  const { data: rows = [] } = useQuery(
    `SELECT s.*, m.full_name AS member_name, m.member_code, m.phone AS member_phone, m.id AS member_id_val
       FROM savings_accounts s LEFT JOIN members m ON m.id = s.member_id
       WHERE s.id = ? LIMIT 1`,
    [id]
  )
  const { data: txRows = [] } = useQuery(
    "SELECT * FROM transactions WHERE reference_id = ? OR member_id = (SELECT member_id FROM savings_accounts WHERE id = ?) ORDER BY created_at DESC LIMIT 100",
    [id, id]
  )

  const r = (rows[0] as any) ?? initialAccount
  if (!r) return <div className="p-6 text-sm text-muted-foreground">Account not found.</div>

  const account = {
    id: r.id, account_number: r.account_number ?? r.accountNumber, balance: Number(r.balance),
    account_type: r.account_type ?? r.accountType, is_locked: Boolean(r.is_locked ?? r.isLocked),
    lock_until: r.lock_until ?? r.lockUntil ?? null, lock_reason: r.lock_reason ?? r.lockReason ?? null,
    created_at: r.created_at ?? r.createdAt, updated_at: r.updated_at ?? r.updatedAt,
    member_id: r.member_id ?? r.memberId, category_id: r.category_id ?? r.categoryId,
    memberName: r.member_name ?? r.memberName ?? "", memberCode: r.member_code ?? r.memberCode ?? "",
    memberPhone: r.member_phone ?? r.memberPhone ?? null,
  }

  const txSource = (txRows as any[]).length > 0 ? (txRows as any[]) : initialTransactions
  const transactions = txSource.map((t: any) => ({
    id: t.id, type: t.type, amount: Number(t.amount), narration: t.narration ?? t.description,
    paymentMethod: t.payment_method ?? t.paymentMethod, createdAt: t.created_at ?? t.createdAt,
  }))

  return <SavingsDetailClient account={account as any} transactions={transactions as any} />
}

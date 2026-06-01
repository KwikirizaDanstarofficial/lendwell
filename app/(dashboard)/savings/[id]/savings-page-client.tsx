"use client"
import { useQuery } from "@powersync/react"
import { SavingsDetailClient } from "./savings-detail-client"

export function SavingsPageClient({ id }: { id: string }) {
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

  const r = rows[0] as any
  if (!r) return <div className="p-6 text-sm text-muted-foreground">Account not found or not yet synced.</div>

  const account = {
    id: r.id, account_number: r.account_number, balance: Number(r.balance),
    account_type: r.account_type, is_locked: Boolean(r.is_locked),
    lock_until: r.lock_until ?? null, lock_reason: r.lock_reason ?? null,
    created_at: r.created_at, updated_at: r.updated_at,
    member_id: r.member_id, category_id: r.category_id,
    memberName: r.member_name ?? "", memberCode: r.member_code ?? "",
    memberPhone: r.member_phone ?? null,
  }

  const transactions = (txRows as any[]).map((t) => ({
    id: t.id, type: t.type, amount: Number(t.amount), narration: t.narration,
    paymentMethod: t.payment_method, createdAt: t.created_at,
  }))

  return <SavingsDetailClient account={account as any} transactions={transactions as any} />
}

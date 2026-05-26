import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { getSavingsById, getSavingsTransactions } from "../actions"
import { SavingsDetailClient } from "./savings-detail-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function SavingsDetailPage({ params }: Props) {
  await requireAuth()
  const { id } = await params

  const [account, transactions] = await Promise.all([
    getSavingsById(id),
    getSavingsTransactions(id),
  ])

  if (!account) notFound()

  // Serialize dates to strings for the client component boundary
  const accountForClient = {
    id: account.id,
    account_number: account.account_number,
    balance: account.balance,
    account_type: account.account_type,
    is_locked: account.is_locked,
    lock_until: account.lock_until
      ? (account.lock_until instanceof Date
          ? account.lock_until.toISOString()
          : String(account.lock_until))
      : null,
    lock_reason: account.lock_reason,
    created_at: account.created_at instanceof Date
      ? account.created_at.toISOString()
      : String(account.created_at),
    member_id: account.member_id,
    member_name: account.member_name,
    member_code: account.member_code,
    member_phone: account.member_phone,
  }

  const transactionsForClient = transactions.map((tx: any) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    balanceAfter: tx.balanceAfter,
    paymentMethod: tx.paymentMethod,
    narration: tx.narration,
    createdAt: tx.createdAt instanceof Date
      ? tx.createdAt.toISOString()
      : String(tx.createdAt),
  }))

  return (
    <SavingsDetailClient
      account={accountForClient}
      transactions={transactionsForClient}
    />
  )
}

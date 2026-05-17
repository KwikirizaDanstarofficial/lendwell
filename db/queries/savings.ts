import { supabaseAdmin } from "@/lib/supabase/server"

export async function getAllSavingsAccounts(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('savings_accounts')
    .select(`
      id,
      account_number,
      balance,
      account_type,
      is_locked,
      lock_until,
      lock_reason,
      created_at,
      updated_at,
      member_id,
      category_id,
      members:member_id (
        full_name,
        member_code,
        phone
      ),
      savings_categories:category_id (
        name
      )
    `)
    .eq('sacco_id', saccoId)
    .order('balance', { ascending: false })
    .limit(1000)

  if (error) {
    throw new Error(`Failed to fetch savings accounts: ${error.message}`)
  }

  return (data as any[]).map(account => ({
    id: account.id,
    accountNumber: account.account_number,
    balance: account.balance,
    accountType: account.account_type,
    isLocked: account.is_locked,
    lockUntil: account.lock_until ? new Date(account.lock_until) : null,
    lockReason: account.lock_reason,
    createdAt: new Date(account.created_at),
    updatedAt: new Date(account.updated_at),
    memberId: account.member_id,
    categoryId: account.category_id,
    memberName: account.members?.full_name,
    memberCode: account.members?.member_code,
    memberPhone: account.members?.phone,
    categoryName: account.savings_categories?.name,
  }))
}

export async function getSavingsStats(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('savings_accounts')
    .select('balance, is_locked, account_type')
    .eq('sacco_id', saccoId)

  if (error) {
    throw new Error(`Failed to fetch savings stats: ${error.message}`)
  }

  let totalBalance = 0
  let lockedAccounts = 0
  let regularAccounts = 0
  let fixedAccounts = 0

  for (const account of data ?? []) {
    totalBalance += account.balance
    if (account.is_locked) lockedAccounts++
    if (account.account_type === 'regular') regularAccounts++
    if (account.account_type === 'fixed') fixedAccounts++
  }

  const totalAccounts = data?.length ?? 0

  return {
    totalBalance,
    totalAccounts,
    lockedAccounts,
    regularAccounts,
    fixedAccounts,
    avgBalance: totalAccounts > 0 ? Math.floor(totalBalance / totalAccounts) : 0,
  }
}

export async function getSavingsTransactions(accountId: string) {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('reference_id', accountId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(`Failed to fetch savings transactions: ${error.message}`)
  }

  return data.map(transaction => ({
    id: transaction.id,
    saccoId: transaction.sacco_id,
    memberId: transaction.member_id,
    type: transaction.type,
    amount: transaction.amount,
    balanceAfter: transaction.balance_after,
    referenceId: transaction.reference_id,
    paymentMethod: transaction.payment_method,
    narration: transaction.narration,
    createdAt: new Date(transaction.created_at),
  }))
}

export async function getMembersForSavings(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('members')
    .select('id, full_name, member_code')
    .eq('sacco_id', saccoId)
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch members for savings: ${error.message}`)
  }

  return data.map(member => ({
    id: member.id,
    fullName: member.full_name,
    memberCode: member.member_code,
  }))
}

export async function getSavingsCategoriesForSelect(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('savings_categories')
    .select('*')
    .eq('sacco_id', saccoId)

  if (error) {
    throw new Error(`Failed to fetch savings categories: ${error.message}`)
  }

  return data.map(category => ({
    id: category.id,
    saccoId: category.sacco_id,
    name: category.name,
    description: category.description,
    interestRate: category.interest_rate,
    isFixed: category.is_fixed,
    isActive: category.is_active,
    createdAt: new Date(category.created_at),
  }))
}

export async function getSavingsById(id: string, saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('savings_accounts')
    .select(`
      id,
      sacco_id,
      member_id,
      category_id,
      account_number,
      balance,
      account_type,
      is_locked,
      lock_until,
      lock_reason,
      created_at,
      updated_at,
      members:member_id (
        full_name,
        member_code,
        phone
      )
    `)
    .eq('id', id)
    .eq('sacco_id', saccoId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch savings account: ${error.message}`)
  }

  if (!data) return null

  const d = data as any
  return {
    id: d.id,
    saccoId: d.sacco_id,
    memberId: d.member_id,
    categoryId: d.category_id,
    accountNumber: d.account_number,
    balance: d.balance,
    accountType: d.account_type,
    isLocked: d.is_locked,
    lockUntil: d.lock_until ? new Date(d.lock_until) : null,
    lockReason: d.lock_reason,
    createdAt: new Date(d.created_at),
    updatedAt: new Date(d.updated_at),
    memberName: d.members?.full_name,
    memberCode: d.members?.member_code,
    memberPhone: d.members?.phone,
  }
}

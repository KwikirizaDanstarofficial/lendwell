"use server"

import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendSms, getSmsTemplates } from "@/lib/sms"
import { initiateFlutterwaveTransfer } from "@/lib/payments/flutterwave"
import { z } from "zod"
import type { ReceiptData } from "@/types/receipt"

export type SavingsFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  receipt?: ReceiptData
}

// ─── Create Savings Account ───────────────────────────────────────────────────

export async function createSavingsAccountAction(
  prevState: SavingsFormState,
  formData: FormData
): Promise<SavingsFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    // Admin, cashier, and field agent can create savings accounts
    if (!["admin", "cashier", "field_agent"].includes(user.role)) {
      console.log(
        `Permission denied: User ${user.email} (role: ${user.role}) attempted to create savings account`
      )
      return { error: "You don't have permission to create savings accounts" }
    }

    const member_id = formData.get("member_id") as string
    const category_id = formData.get("category_id") as string
    const account_type = formData.get("account_type") as string
    const initial_deposit =
      parseInt(formData.get("initial_deposit") as string) * 100 || 0

    if (!member_id) return { error: "Please select a member." }

    

    // Check for existing account
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('savings_accounts')
      .select('id')
      .eq('member_id', member_id)
      .eq('sacco_id', user.saccoId)

    if (existingError) {
      console.error('Error checking existing accounts:', existingError)
      return { error: "Failed to check existing accounts." }
    }

    if (existing && existing.length > 0) {
      return { error: "Member already has a savings account." }
    }

    const account_number = `SAV-${Date.now()}`

    // Create savings account
    const { data: account, error: insertError } = await supabaseAdmin
      .from('savings_accounts')
      .insert({
        sacco_id: user.saccoId,
        member_id,
        category_id: category_id || null,
        account_number,
        balance: initial_deposit,
        account_type: (account_type as "regular" | "fixed") || "regular",
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating savings account:', insertError)
      return { error: "Failed to create savings account." }
    }

    if (initial_deposit > 0) {
      // Create initial deposit transaction
      const { error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
          sacco_id: user.saccoId,
          member_id,
          type: "savings_deposit",
          amount: initial_deposit,
          balance_after: initial_deposit,
          reference_id: account.id,
          narration: "Initial deposit",
          payment_method: "flutterwave",
        })

      if (transactionError) {
        console.error('Error creating initial transaction:', transactionError)
        // Continue anyway
      }

      // Get member + sacco for SMS
      const [{ data: member }, { data: saccoForSms }] = await Promise.all([
        supabaseAdmin.from('members').select('phone, full_name, member_code').eq('id', member_id).single(),
        supabaseAdmin.from('saccos').select('settings').eq('id', user.saccoId).single(),
      ])

      if (member?.phone) {
        try {
          const saccoSettings = (() => { try { return JSON.parse(saccoForSms?.settings ?? "{}") } catch { return {} } })()
          const templates = getSmsTemplates(saccoSettings?.sms?.language)
          await sendSms({
            to: member.phone,
            message: templates.savingsDeposit(
              member.full_name,
              initial_deposit / 100,
              initial_deposit / 100,
              member.member_code
            ),
          })
        } catch (smsError) {
          console.error("[Savings] SMS notification failed:", smsError)
        }
      }
    }

    revalidatePath("/savings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to create savings account." }
  }
}

// ─── Deposit ──────────────────────────────────────────────────────────────────

export async function depositAction(
  prevState: SavingsFormState,
  formData: FormData
): Promise<SavingsFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    // Admin, cashier, and field agent can deposit to savings
    if (!["admin", "cashier", "field_agent"].includes(user.role)) {
      console.log(
        `Permission denied: User ${user.email} (role: ${user.role}) attempted to deposit to savings`
      )
      return {
        error: "You don't have permission to deposit to savings accounts",
      }
    }

    const account_id = formData.get("account_id") as string
    const amount = parseInt(formData.get("amount") as string) * 100
    const narration = formData.get("narration") as string
    const payment_method = formData.get("payment_method") as string

    if (!amount || amount <= 0) return { error: "Enter a valid amount." }

    

    // Get the account
    const { data: account, error: accountError } = await supabaseAdmin
      .from('savings_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('sacco_id', user.saccoId)
      .single()

    if (accountError || !account) {
      return { error: "Account not found." }
    }
    if (account.is_locked) {
      return { error: "This account is locked." }
    }

    const newBalance = account.balance + amount

    // Update account balance
    const { error: updateError } = await supabaseAdmin
      .from('savings_accounts')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', account_id)

    if (updateError) {
      console.error('Error updating account balance:', updateError)
      return { error: "Failed to process deposit." }
    }

    // Create transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        sacco_id: user.saccoId,
        member_id: account.member_id,
        type: "savings_deposit",
        amount,
        balance_after: newBalance,
        reference_id: account_id,
        narration: narration || "Savings deposit",
        payment_method: payment_method || "flutterwave",
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return { error: "Failed to process deposit." }
    }

    // Get member + sacco for SMS and receipt
    const [{ data: member }, { data: sacco }] = await Promise.all([
      supabaseAdmin
        .from('members')
        .select('phone, full_name, member_code')
        .eq('id', account.member_id)
        .single(),
      supabaseAdmin
        .from('saccos')
        .select('name, settings')
        .eq('id', user.saccoId)
        .single(),
    ])

    if (member?.phone) {
      try {
        const saccoSettings = (() => { try { return JSON.parse(sacco?.settings ?? "{}") } catch { return {} } })()
        const templates = getSmsTemplates(saccoSettings?.sms?.language)
        await sendSms({
          to: member.phone,
          message: templates.savingsDeposit(
            member.full_name,
            amount / 100,
            newBalance / 100,
            member.member_code
          ),
        })
      } catch (smsError) {
        console.error("[Savings] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/savings")
    return {
      success: true,
      receipt: {
        receiptRef: `DEP-${Date.now()}`,
        type: "Savings Deposit",
        memberName: member?.full_name ?? "Unknown",
        memberCode: member?.member_code ?? undefined,
        amount: amount / 100,
        balanceAfter: newBalance / 100,
        paymentMethod: payment_method || "cash",
        narration: narration || "Savings deposit",
        performedBy: user.fullName,
        performedAt: new Date().toISOString(),
        saccoName: sacco?.name ?? undefined,
      },
    }
  } catch (err) {
    console.error(err)
    return { error: "Failed to process deposit." }
  }
}

// ─── Withdraw ─────────────────────────────────────────────────────────────────

export async function withdrawAction(
  prevState: SavingsFormState,
  formData: FormData
): Promise<SavingsFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    // Admin, cashier, and field agent can withdraw from savings
    if (!["admin", "cashier", "field_agent"].includes(user.role)) {
      console.log(
        `Permission denied: User ${user.email} (role: ${user.role}) attempted to withdraw from savings`
      )
      return {
        error: "You don't have permission to withdraw from savings accounts",
      }
    }

    const account_id = formData.get("account_id") as string
    const amount = parseInt(formData.get("amount") as string) * 100
    const narration = formData.get("narration") as string
    const payment_method = (formData.get("payment_method") as string) || "cash"

    if (!amount || amount <= 0) return { error: "Enter a valid amount." }

    

    // Get the account
    const { data: account, error: accountError } = await supabaseAdmin
      .from('savings_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('sacco_id', user.saccoId)
      .single()

    if (accountError || !account) {
      return { error: "Account not found." }
    }
    if (account.is_locked) {
      return { error: "This account is locked. Unlock it first." }
    }
    if (account.balance < amount) {
      return { error: "Insufficient balance." }
    }

    const newBalance = account.balance - amount

    // Update account balance
    const { error: updateError } = await supabaseAdmin
      .from('savings_accounts')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', account_id)

    if (updateError) {
      console.error('Error updating account balance:', updateError)
      return { error: "Failed to process withdrawal." }
    }

    // Create transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        sacco_id: user.saccoId,
        member_id: account.member_id,
        type: "savings_withdrawal",
        amount,
        balance_after: newBalance,
        reference_id: account_id,
        narration: narration || "Savings withdrawal",
        payment_method:
          payment_method === "mobile_money" ? "flutterwave" : payment_method,
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return { error: "Failed to process withdrawal." }
    }

    // Get member + sacco for transfer, SMS, and receipt
    const [{ data: member }, { data: sacco }] = await Promise.all([
      supabaseAdmin
        .from('members')
        .select('phone, full_name, member_code')
        .eq('id', account.member_id)
        .single(),
      supabaseAdmin
        .from('saccos')
        .select('name, settings')
        .eq('id', user.saccoId)
        .single(),
    ])

    // Initiate Flutterwave transfer to member's phone
    if (member?.phone) {
      try {
        const normalizedPhone = member.phone
          .replace(/\s+/g, "")
          .replace(/^\+/, "")
          .replace(/^0/, "256")
        const account_bank =
          normalizedPhone.startsWith("25675") ||
          normalizedPhone.startsWith("25670")
            ? "MPS"
            : "ATL"
        await initiateFlutterwaveTransfer({
          account_bank,
          account_number: normalizedPhone,
          amount: amount / 100,
          currency: "UGX",
          narration: narration || "Savings withdrawal",
          reference: `WD-${account_id}-${Date.now()}`,
          beneficiary_name: member.full_name,
        })
      } catch (transferError) {
        console.error("[Savings] Flutterwave transfer failed:", transferError)
      }

      try {
        const saccoSettings = (() => { try { return JSON.parse(sacco?.settings ?? "{}") } catch { return {} } })()
        const templates = getSmsTemplates(saccoSettings?.sms?.language)
        await sendSms({
          to: member.phone,
          message: templates.savingsDeposit(
            member.full_name,
            amount / 100,
            newBalance / 100,
            member.member_code
          ),
        })
      } catch (smsError) {
        console.error("[Savings] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/savings")
    return {
      success: true,
      receipt: {
        receiptRef: `WD-${Date.now()}`,
        type: "Savings Withdrawal",
        memberName: member?.full_name ?? "Unknown",
        memberCode: member?.member_code ?? undefined,
        amount: amount / 100,
        balanceAfter: newBalance / 100,
        paymentMethod: payment_method || "cash",
        narration: narration || "Savings withdrawal",
        performedBy: user.fullName,
        performedAt: new Date().toISOString(),
        saccoName: sacco?.name ?? undefined,
      },
    }
  } catch (err) {
    console.error(err)
    return { error: "Failed to process withdrawal." }
  }
}

// ─── Lock Account ─────────────────────────────────────────────────────────────

export async function lockAccountAction(
  prevState: SavingsFormState,
  formData: FormData
): Promise<SavingsFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    // Only admin can lock savings accounts
    if (user.role !== "admin") {
      console.log(
        `Permission denied: User ${user.email} (role: ${user.role}) attempted to lock savings account`
      )
      return { error: "You don't have permission to lock savings accounts" }
    }

    const account_id = formData.get("account_id") as string
    const lock_until = formData.get("lock_until") as string
    const lock_reason = formData.get("lock_reason") as string

    if (!lock_until) return { error: "Please set a lock expiry date." }

    

    // Get the account
    const { data: account, error: accountError } = await supabaseAdmin
      .from('savings_accounts')
      .select('*')
      .eq('id', account_id)
      .single()

    if (accountError || !account) {
      return { error: "Account not found." }
    }

    // Update account lock status
    const { error: updateError } = await supabaseAdmin
      .from('savings_accounts')
      .update({
        is_locked: true,
        lock_until,
        lock_reason: lock_reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', account_id)

    if (updateError) {
      console.error('Error locking account:', updateError)
      return { error: "Failed to lock account." }
    }

    // Get member for SMS
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', account.member_id)
      .single()

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, your savings account ${account.account_number} has been locked until ${lock_until}. Reason: ${lock_reason || "N/A"}. - SACCO`,
        })
      } catch (smsError) {
        console.error("[Savings] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/savings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to lock account." }
  }
}

// ─── Unlock Account ───────────────────────────────────────────────────────────

export async function unlockAccountAction(
  id: string
): Promise<SavingsFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    // Only admin can unlock savings accounts
    if (user.role !== "admin") {
      console.log(
        `Permission denied: User ${user.email} (role: ${user.role}) attempted to unlock savings account`
      )
      return { error: "You don't have permission to unlock savings accounts" }
    }

    

    // Get the account
    const { data: account, error: accountError } = await supabaseAdmin
      .from('savings_accounts')
      .select('*')
      .eq('id', id)
      .single()

    if (accountError || !account) {
      return { error: "Account not found." }
    }

    // Update account unlock status
    const { error: updateError } = await supabaseAdmin
      .from('savings_accounts')
      .update({
        is_locked: false,
        lock_until: null,
        lock_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error unlocking account:', updateError)
      return { error: "Failed to unlock account." }
    }

    // Get member for SMS
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', account.member_id)
      .single()

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, your savings account ${account.account_number} has been unlocked. - SACCO`,
        })
      } catch (smsError) {
        console.error("[Savings] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/savings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to unlock account." }
  }
}

// ─── Trim to Loan ─────────────────────────────────────────────────────────────

export async function trimToLoanAction(
  prevState: SavingsFormState,
  formData: FormData
): Promise<SavingsFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    // Admin, cashier, and field agent can trim savings to loans
    if (!["admin", "cashier", "field_agent"].includes(user.role)) {
      console.log(
        `Permission denied: User ${user.email} (role: ${user.role}) attempted to trim savings to loan`
      )
      return { error: "You don't have permission to trim savings to loans" }
    }

    const account_id = formData.get("account_id") as string
    const loan_id = formData.get("loan_id") as string
    const amount = parseInt(formData.get("amount") as string) * 100

    if (!amount || amount <= 0) return { error: "Enter a valid amount." }
    if (!loan_id) return { error: "Please select a loan." }

    

    // Get the savings account
    const { data: account, error: accountError } = await supabaseAdmin
      .from('savings_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('sacco_id', user.saccoId)
      .single()

    if (accountError || !account) {
      return { error: "Account not found." }
    }
    if (account.is_locked) {
      return { error: "Account is locked." }
    }
    if (account.balance < amount) {
      return { error: "Insufficient savings balance." }
    }

    // Get the loan
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', loan_id)
      .eq('sacco_id', user.saccoId)
      .single()

    if (loanError || !loan) {
      return { error: "Loan not found." }
    }

    const repayAmount = Math.min(amount, loan.balance)
    const newSavingsBalance = account.balance - repayAmount
    const newLoanBalance = loan.balance - repayAmount

    // Update savings account balance
    const { error: savingsUpdateError } = await supabaseAdmin
      .from('savings_accounts')
      .update({
        balance: newSavingsBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', account_id)

    if (savingsUpdateError) {
      console.error('Error updating savings balance:', savingsUpdateError)
      return { error: "Failed to update savings balance." }
    }

    // Update loan balance and status
    const { error: loanUpdateError } = await supabaseAdmin
      .from('loans')
      .update({
        balance: newLoanBalance,
        status: newLoanBalance === 0 ? "settled" : "active",
        settled_at: newLoanBalance === 0 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', loan_id)

    if (loanUpdateError) {
      console.error('Error updating loan balance:', loanUpdateError)
      return { error: "Failed to update loan balance." }
    }

    // Create transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        sacco_id: user.saccoId,
        member_id: account.member_id,
        type: "loan_repayment",
        amount: repayAmount,
        balance_after: newSavingsBalance,
        reference_id: loan_id,
        narration: `Loan repayment from savings - ${loan.loan_ref}`,
        payment_method: "flutterwave",
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return { error: "Failed to create transaction record." }
    }

    // Get member for SMS
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', account.member_id)
      .single()

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, UGX ${(repayAmount / 100).toLocaleString()} trimmed from savings to loan ${loan.loan_ref}. Loan balance: UGX ${(newLoanBalance / 100).toLocaleString()}. - SACCO`,
        })
      } catch (smsError) {
        console.error("[Savings] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/savings")
    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to trim savings to loan." }
  }
}

// ─── Get Savings Categories For Select ──────────────────────────────────────

export async function getSavingsCategoriesForSelect(): Promise<any[]> {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    

    const { data, error } = await supabaseAdmin
      .from('savings_categories')
      .select('*')
      .eq('sacco_id', user.saccoId)

    if (error) {
      console.error('Error fetching savings categories:', error)
      return []
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
  } catch (err) {
    console.error(err)
    return []
  }
}

// ─── Get Members For Savings ─────────────────────────────────────────────────

export async function getMembersForSavings(): Promise<any[]> {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    

    const { data, error } = await supabaseAdmin
      .from('members')
      .select('id, full_name, member_code, phone')
      .eq('sacco_id', user.saccoId)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Error fetching members for savings:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error(err)
    return []
  }
}

// ─── Get Savings By ID ───────────────────────────────────────────────────────

export async function getSavingsById(id: string): Promise<any | null> {
  try {
    

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
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch savings account: ${error.message}`)
    }

    return {
      id: data.id,
      sacco_id: data.sacco_id,
      member_id: data.member_id,
      category_id: data.category_id,
      account_number: data.account_number,
      balance: data.balance,
      account_type: data.account_type,
      is_locked: data.is_locked,
      lock_until: data.lock_until ? new Date(data.lock_until) : null,
      lock_reason: data.lock_reason,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      member_name: (data as any).members?.full_name,
      member_code: (data as any).members?.member_code,
      member_phone: (data as any).members?.phone,
    }
  } catch (err) {
    console.error(err)
    return null
  }
}

// ─── Get Savings Transactions ─────────────────────────────────────────────────

export async function getSavingsTransactions(
  accountId: string
): Promise<any[]> {
  try {
    

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('reference_id', accountId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching savings transactions:', error)
      return []
    }

    return data?.map(tx => ({
      id: tx.id,
      saccoId: tx.sacco_id,
      memberId: tx.member_id,
      type: tx.type,
      amount: tx.amount,
      balanceAfter: tx.balance_after,
      referenceId: tx.reference_id,
      paymentMethod: tx.payment_method,
      narration: tx.narration,
      createdAt: new Date(tx.created_at),
    })) || []
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function getSavingsTransactionsAction(
  accountId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('reference_id', accountId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching savings transactions:', error)
      return { success: false, error: 'Failed to fetch transactions' }
    }

    const transactionsList = data?.map(tx => ({
      id: tx.id,
      saccoId: tx.sacco_id,
      memberId: tx.member_id,
      type: tx.type,
      amount: tx.amount,
      balanceAfter: tx.balance_after,
      referenceId: tx.reference_id,
      paymentMethod: tx.payment_method,
      narration: tx.narration,
      createdAt: new Date(tx.created_at),
    })) || []

    return { success: true, data: transactionsList }
  } catch (err) {
    console.error(err)
    return { success: false, error: "Failed to fetch transactions." }
  }
}

// ─── Delete Savings Account ───────────────────────────────────────────────────

export async function deleteSavingsAccountAction(
  id: string
): Promise<SavingsFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    // Only admin can delete savings accounts
    if (user.role !== "admin") {
      console.log(
        `Permission denied: User ${user.email} (role: ${user.role}) attempted to delete savings account`
      )
      return { error: "You don't have permission to delete savings accounts" }
    }

    

    // Get the account to verify it exists
    const { data: account, error: accountError } = await supabaseAdmin
      .from('savings_accounts')
      .select('id')
      .eq('id', id)
      .single()

    if (accountError || !account) {
      return { error: "Account not found." }
    }

    // Delete the account
    const { error: deleteError } = await supabaseAdmin
      .from('savings_accounts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting savings account:', deleteError)
      return { error: "Failed to delete savings account." }
    }

    revalidatePath("/savings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete savings account." }
  }
}

// ─── Update Savings Account ───────────────────────────────────────────────────

export async function updateSavingsAction(
  id: string,
  data: {
    category_id?: string | null
    account_type?: "regular" | "fixed"
  }
): Promise<SavingsFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    // Only admin can update savings accounts
    if (user.role !== "admin") {
      console.log(
        `Permission denied: User ${user.email} (role: ${user.role}) attempted to update savings account`
      )
      return { error: "You don't have permission to update savings accounts" }
    }

    

    // Get the account to verify it exists and get current values
    const { data: account, error: accountError } = await supabaseAdmin
      .from('savings_accounts')
      .select('category_id, account_type')
      .eq('id', id)
      .single()

    if (accountError || !account) {
      return { error: "Account not found." }
    }

    // Update the account
    const { error: updateError } = await supabaseAdmin
      .from('savings_accounts')
      .update({
        category_id: data.category_id ?? account.category_id,
        account_type: data.account_type ?? account.account_type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating savings account:', updateError)
      return { error: "Failed to update savings account." }
    }

    revalidatePath("/savings")
    revalidatePath(`/savings/${id}`)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to update savings account." }
  }
}

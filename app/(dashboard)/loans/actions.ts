// app/(dashboard)/loans/actions.ts (Complete)
"use server"

import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendSms, smsTemplates } from "@/lib/sms"
import {
  calculateLoan,
  getInterestRateForAmount,
} from "@/lib/pdf/loan-calculator"
import {
  initiateFlutterwaveTransfer,
  initiateFlutterwaveCharge,
} from "@/lib/payments/flutterwave"
import { z } from "zod"

export type LoanFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const loanSchema = z.object({
  member_id: z.string().uuid("Please select a member"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  duration_months: z.coerce.number().min(1).default(12),
  due_date: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
})

// ─── Add Loan ─────────────────────────────────────────────────────────────────

export async function addLoanAction(
  prevState: LoanFormState,
  formData: FormData
): Promise<LoanFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    const raw = {
      member_id: formData.get("member_id") as string,
      amount: formData.get("amount") as string,
      duration_months: formData.get("duration_months") as string,
      due_date: formData.get("due_date") as string,
      notes: formData.get("notes") as string,
    }

    const parsed = loanSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    

    // Get member
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('full_name, phone')
      .eq('id', parsed.data.member_id)
      .single()

    if (memberError || !member) return { error: "Member not found." }

    const amountInCents = Math.floor(parsed.data.amount * 100)

    // Get applicable interest rate from interest_rates table
    const { data: interestRatesList, error: ratesError } = await supabaseAdmin
      .from('interest_rates')
      .select('*')
      .eq('sacco_id', user.saccoId)
      .eq('is_active', true)

    if (ratesError) {
      console.error('Error fetching interest rates:', ratesError)
      return { error: "Failed to fetch interest rates." }
    }

    const { rate: interestRate, rateType: interestType } =
      getInterestRateForAmount(amountInCents, interestRatesList || [])

    // Calculate loan details
    const calc = calculateLoan({
      principal: amountInCents,
      interestRate: interestRate,
      interestType: interestType as "daily" | "monthly" | "annual",
      durationMonths: parsed.data.duration_months,
    })

    const loan_ref = `LN-${Date.now()}`

    // Get the interest rate ID
    const applicableRate = (interestRatesList || []).find(
      (rate) =>
        amountInCents >= rate.min_amount && amountInCents <= rate.max_amount
    )

    // Insert loan
    const { error: insertError } = await supabaseAdmin
      .from('loans')
      .insert({
        sacco_id: user.saccoId,
        member_id: parsed.data.member_id,
        interest_rate_id: applicableRate?.id,
        loan_ref,
        amount: amountInCents,
        expected_received: calc.totalExpectedReceived,
        balance: calc.totalExpectedReceived,
        interest_rate: String(interestRate),
        interest_type: interestType,
        duration_months: parsed.data.duration_months,
        late_penalty_fee: calc.latePenaltyFee,
        daily_payment: calc.dailyPayment,
        monthly_payment: calc.monthlyPayment,
        due_date: parsed.data.due_date,
        notes: parsed.data.notes || null,
        status: "pending",
      })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return { error: "Failed to add loan. Please try again." }
    }

    // Send SMS notification (don't fail if SMS fails)
    if (member.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, your loan application of UGX ${(amountInCents / 100).toLocaleString()} has been submitted. Ref: ${loan_ref}. Expected to receive: UGX ${(calc.totalExpectedReceived / 100).toLocaleString()}. Awaiting approval. - SACCO`,
        })
      } catch (smsError) {
        console.error("[Loan] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/loans")
    revalidatePath("/members")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add loan. Please try again." }
  }
}

// ─── Approve Loan ─────────────────────────────────────────────────────────────

export async function approveLoanAction(id: string): Promise<LoanFormState> {
  try {
    

    // Get the loan
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', id)
      .single()

    if (loanError || !loan) {
      return { error: "Loan not found." }
    }

    // Get member for SMS
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('phone, full_name, member_code')
      .eq('id', loan.member_id)
      .single()

    // Update loan status
    const { error: updateError } = await supabaseAdmin
      .from('loans')
      .update({
        status: "approved",
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return { error: "Failed to approve loan." }
    }

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: smsTemplates.loanApproved(
            member.full_name,
            loan.amount / 100,
            member.member_code
          ),
        })
      } catch (smsError) {
        console.error("[Loan] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to approve loan." }
  }
}

// ─── Decline Loan ─────────────────────────────────────────────────────────────

export async function declineLoanAction(
  id: string,
  reason: string
): Promise<LoanFormState> {
  try {
    

    // Get the loan
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', id)
      .single()

    if (loanError || !loan) {
      return { error: "Loan not found." }
    }

    // Get member for SMS
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', loan.member_id)
      .single()

    // Update loan status
    const { error: updateError } = await supabaseAdmin
      .from('loans')
      .update({
        status: "declined",
        decline_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return { error: "Failed to decline loan." }
    }

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: smsTemplates.loanDeclined(member.full_name, reason),
        })
      } catch (smsError) {
        console.error("[Loan] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to decline loan." }
  }
}

// ─── Disburse Loan ────────────────────────────────────────────────────────────

export async function disburseLoanAction(id: string): Promise<LoanFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    

    // Get the loan
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', id)
      .single()

    if (loanError || !loan) {
      return { error: "Loan not found." }
    }
    if (loan.status !== "approved") {
      return { error: "Loan must be approved first." }
    }

    // Get member for transfer and SMS
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', loan.member_id)
      .single()

    // Update loan status
    const { error: updateError } = await supabaseAdmin
      .from('loans')
      .update({
        status: "disbursed",
        disbursed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return { error: "Failed to disburse loan." }
    }

    // Create transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        sacco_id: user.saccoId,
        member_id: loan.member_id,
        type: "loan_disbursement",
        amount: loan.amount,
        narration: `Loan disbursement - ${loan.loan_ref}`,
        payment_method: "flutterwave",
      })

    if (transactionError) {
      console.error('Transaction creation error:', transactionError)
      // Continue anyway as the loan status was updated
    }

    // Initiate Flutterwave transfer to member's phone
    if (member?.phone) {
      try {
        const normalizedPhone = member.phone
          .replace(/\s+/g, "")
          .replace(/^\+/, "")
          .replace(/^0/, "256")
        // Assume MTN for now, can be improved to detect network
        const account_bank =
          normalizedPhone.startsWith("25675") ||
          normalizedPhone.startsWith("25670")
            ? "MPS"
            : "ATL"
        await initiateFlutterwaveTransfer({
          account_bank,
          account_number: normalizedPhone,
          amount: loan.amount / 100,
          currency: "UGX",
          narration: `Loan disbursement - ${loan.loan_ref}`,
          reference: `DISB-${loan.id}`,
          beneficiary_name: member.full_name,
        })
      } catch (transferError) {
        console.error("[Loan] Flutterwave transfer failed:", transferError)
        // Still proceed, maybe mark as pending transfer
      }

      try {
        await sendSms({
          to: member.phone,
          message: smsTemplates.loanDisbursed(
            member.full_name,
            `UGX ${(loan.amount / 100).toLocaleString()}`,
            loan.loan_ref
          ),
        })
      } catch (smsError) {
        console.error("[Loan] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to disburse loan." }
  }
}

// ─── Make Repayment ───────────────────────────────────────────────────────────

export async function repayLoanAction(
  prevState: LoanFormState,
  formData: FormData
): Promise<LoanFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    

    const id = formData.get("loan_id") as string
    const amountStr = (formData.get("amount") as string)?.replace(/,/g, "")
    const amount = Math.round(parseFloat(amountStr || "0") * 100)
    const payment_method = (formData.get("payment_method") as string) || "cash"

    if (!amountStr || isNaN(amount) || amount <= 0)
      return { error: "Valid amount required." }

    // Get the loan
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', id)
      .single()

    if (loanError || !loan) {
      return { error: "Loan not found." }
    }
    if (loan.status !== "disbursed" && loan.status !== "active") {
      return { error: "Loan must be disbursed to record repayments." }
    }

    // Get member for payment processing and SMS
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', loan.member_id)
      .single()

    // Process payment if mobile money
    if (payment_method === "mobile_money" && member?.phone) {
      try {
        await initiateFlutterwaveCharge({
          phone_number: member.phone,
          amount: amount / 100,
          currency: "UGX",
          tx_ref: `LOAN-REPAY-${loan.id}-${Date.now()}`,
          narration: `Loan repayment - ${loan.loan_ref}`,
          fullname: member.full_name,
        })
      } catch (chargeError) {
        console.error(
          "[Loan Repayment] Flutterwave charge failed:",
          chargeError
        )
        return {
          error:
            "Payment processing failed. Please try again or contact support.",
        }
      }
    }

    const newBalance = Math.max(0, loan.balance - amount)
    const newStatus = newBalance === 0 ? "settled" : "active"

    // Update loan
    const { error: updateError } = await supabaseAdmin
      .from('loans')
      .update({
        balance: newBalance,
        status: newStatus,
        settled_at: newBalance === 0 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return { error: "Failed to record repayment." }
    }

    // Create transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        sacco_id: user.saccoId,
        member_id: loan.member_id,
        type: "loan_repayment",
        amount,
        balance_after: newBalance,
        narration: `Loan repayment - ${loan.loan_ref}`,
        payment_method:
          payment_method === "mobile_money" ? "flutterwave" : payment_method,
      })

    if (transactionError) {
      console.error('Transaction creation error:', transactionError)
      // Continue anyway as the loan was updated
    }

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: smsTemplates.loanRepayment(
            member.full_name,
            `UGX ${(amount / 100).toLocaleString()}`,
            `UGX ${(newBalance / 100).toLocaleString()}`
          ),
        })
      } catch (smsError) {
        console.error("[Loan] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/loans")
    revalidatePath(`/members/${loan.member_id}`)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to record repayment." }
  }
}

// ─── Top Up Loan ──────────────────────────────────────────────────────────────

export async function topUpLoanAction(
  prevState: LoanFormState,
  formData: FormData
): Promise<LoanFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    

    const id = formData.get("loan_id") as string
    const amountStr = (formData.get("amount") as string)?.replace(/,/g, "")
    const amount = Math.round(parseFloat(amountStr || "0") * 100)
    const reason = formData.get("reason") as string
    const payment_method = (formData.get("payment_method") as string) || "cash"
    const notes = formData.get("notes") as string

    if (!amountStr || isNaN(amount) || amount <= 0)
      return { error: "Valid amount required." }

    // Get the loan
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', id)
      .single()

    if (loanError || !loan) {
      return { error: "Loan not found." }
    }
    if (loan.status !== "active" && loan.status !== "disbursed") {
      return { error: "Loan must be active or disbursed to add top-up." }
    }

    // Get member for SMS
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', loan.member_id)
      .single()

    // Add top-up record
    const { error: topUpError } = await supabaseAdmin
      .from('loan_top_ups')
      .insert({
        loan_id: id,
        amount,
        reason,
        payment_method: payment_method as any,
        notes,
        // processed_by: // TODO: Add current user/admin ID when authentication is implemented
      })

    if (topUpError) {
      console.error('Top-up creation error:', topUpError)
      return { error: "Failed to process loan top-up." }
    }

    // Update loan balance (add to balance since top-up increases the amount owed)
    const newBalance = loan.balance + amount

    const { error: updateError } = await supabaseAdmin
      .from('loans')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Loan update error:', updateError)
      return { error: "Failed to process loan top-up." }
    }

    // Record transaction
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        sacco_id: user.saccoId,
        member_id: loan.member_id,
        type: "loan_disbursement", // Top-up is essentially additional disbursement
        amount,
        balance_after: newBalance,
        narration: `Loan top-up - ${loan.loan_ref}${reason ? ` - ${reason}` : ""}`,
        payment_method:
          payment_method === "mobile_money"
            ? "flutterwave"
            : payment_method,
      })

    if (transactionError) {
      console.error('Transaction creation error:', transactionError)
      // Continue anyway as the loan was updated
    }

    // Send SMS notification
    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, your loan ${loan.loan_ref} has been topped up with UGX ${(amount / 100).toLocaleString()}. New balance: UGX ${(newBalance / 100).toLocaleString()}. - SACCO`,
        })
      } catch (smsError) {
        console.error("[Loan Top-up] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/loans")
    revalidatePath(`/loans/${id}`)
    revalidatePath(`/members/${loan.member_id}`)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to process loan top-up." }
  }
}

// ─── Delete Loan ──────────────────────────────────────────────────────────────

export async function deleteLoanAction(id: string): Promise<LoanFormState> {
  try {
    

    const { error } = await supabaseAdmin
      .from('loans')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      return { error: "Failed to delete loan." }
    }

    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete loan." }
  }
}

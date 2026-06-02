"use server"
import { isOfflineError } from "@/lib/offline-safe"
/**
 * app/(dashboard)/loans/actions.ts
 *
 * Server actions for loan management in the SACCO application.
 * Each action runs on the server and orchestrates:
 *   – Authentication and role-based authorisation
 *   – Input validation via Zod
 *   – Interest-rate lookup and repayment schedule calculation
 *   – Database writes via the Supabase admin client
 *   – Payment processing via Flutterwave (disbursal and collection)
 *   – SMS notifications to members
 *   – Audit log entries
 *   – Next.js cache revalidation
 */

import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendSmsOrQueue, sendSms, getSmsTemplates } from "@/lib/sms"
import {
  calculateLoan,
  getInterestRateForAmount,
} from "@/lib/pdf/loan-calculator"
import {
  initiateFlutterwaveTransfer,
  initiateFlutterwaveCharge,
} from "@/lib/payments/flutterwave"
import { z } from "zod"
import type { ReceiptData } from "@/types/receipt"

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Multiplier to convert major currency units (UGX) to minor units (cents).
 * All monetary amounts are stored as integers in minor units.
 */
const CENTS_PER_UNIT = 100

/** Roles permitted to approve, decline, and disburse loans. */
const LOAN_MANAGEMENT_ROLES = ["admin", "cashier"] as const

/** Loan statuses that allow a repayment to be recorded. */
const REPAYABLE_STATUSES = ["disbursed", "active"] as const

/** Loan statuses that allow a top-up to be added. */
const TOP_UP_ELIGIBLE_STATUSES = ["active", "disbursed"] as const

/** Prefix for auto-generated loan reference numbers. */
const LOAN_REF_PREFIX = "LN"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely parse the SACCO settings JSON column.
 * Returns an empty object when the column is null or malformed.
 */
function parseSaccoSettings(raw: string | null | undefined): Record<string, any> {
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

/** Return shape for all loan server actions. */
export type LoanFormState = {
  success?: boolean
  error?: string
  receipt?: ReceiptData
  fieldErrors?: Record<string, string[]>
}

/** Zod schema for validating loan creation input. */
const loanSchema = z.object({
  member_id: z.string().uuid("Please select a member"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  duration_months: z.coerce.number().min(1).default(12),
  due_date: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
})

/**
 * Creates a new loan application for a member.
 * Validates input, calculates interest, inserts the loan record,
 * and notifies the member via SMS.
 */
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

    // Fetch the member to validate existence and get contact info
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('full_name, phone')
      .eq('id', parsed.data.member_id)
      .single()

    if (memberError || !member) return { error: "Member not found." }

    // Convert UGX to cents for storage (avoids floating-point precision issues)
    const amountInCents = Math.floor(parsed.data.amount * 100)

    // Look up the applicable interest rate tier for this amount
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

    // Compute repayment schedule, daily/monthly payment amounts, and penalty fees
    const calc = calculateLoan({
      principal: amountInCents,
      interestRate: interestRate,
      interestType: interestType as "daily" | "monthly" | "annual",
      durationMonths: parsed.data.duration_months,
    })

    const loan_ref = `${LOAN_REF_PREFIX}-${Date.now()}`

    // Find the exact interest rate tier that matches this amount range
    const applicableRate = (interestRatesList || []).find(
      (rate) =>
        amountInCents >= rate.min_amount && amountInCents <= rate.max_amount
    )

    // Insert the loan record with pending status
    const { data: loan, error: insertError } = await supabaseAdmin
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
      .select('id')
      .single()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return { error: "Failed to add loan. Please try again." }
    }

    // Insert guarantors if any were selected
    try {
      const guarantorIdsRaw = formData.get("guarantor_ids") as string
      if (guarantorIdsRaw) {
        const guarantorIds: string[] = JSON.parse(guarantorIdsRaw)
        if (guarantorIds.length > 0) {
          const guarantorRows = guarantorIds.map((memberId: string) => ({
            loan_id: loan!.id,
            member_id: memberId,
            sacco_id: user.saccoId,
            status: "pending",
          }))
          const { error: guarantorError } = await supabaseAdmin
            .from('loan_guarantors')
            .insert(guarantorRows)
          if (guarantorError) {
            console.error('Failed to insert guarantors:', guarantorError)
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse guarantor_ids:', e)
    }

    // Notify the member — SMS failure is non-fatal for loan creation
    if (member.phone) {
      try {
        await sendSmsOrQueue({
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
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to add loan. Please try again." }
  }
}

/**
 * Approves a pending loan and immediately disburses it.
 * Only users with admin or cashier roles can approve loans.
 * Disbursal failure is logged but does not roll back the approval.
 */
export async function approveLoanAction(id: string): Promise<LoanFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }
    if (!(LOAN_MANAGEMENT_ROLES as readonly string[]).includes(user.role)) {
      return { error: "You don't have permission to approve loans." }
    }

    // Fetch the loan and verify it exists
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', id)
      .single()

    if (loanError || !loan) {
      return { error: "Loan not found." }
    }

    // Only pending loans can be approved
    if (loan.status !== "pending") {
      return { error: "Only pending loans can be approved." }
    }

    // Get member for SMS notification
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('phone, full_name, member_code')
      .eq('id', loan.member_id)
      .single()

    // Update loan status to approved
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

    // Attempt automatic disbursement after approval.
    // If disbursement fails, the loan remains approved — a manual retry is possible.
    const disburseResult = await disburseLoanAction(id)
    if (disburseResult.error) {
      console.error("[Loan] Auto-disburse after approve failed:", disburseResult.error)
      revalidatePath("/loans")
      return { success: true, error: "Loan approved but auto-disbursement failed. You can disburse manually." }
    }

    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to approve loan." }
  }
}

/**
 * Declines a pending loan with a reason.
 * Only users with admin or cashier roles can decline loans.
 * The member is notified via SMS with the decline reason.
 */
export async function declineLoanAction(
  id: string,
  reason: string
): Promise<LoanFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }
    if (!(LOAN_MANAGEMENT_ROLES as readonly string[]).includes(user.role)) {
      return { error: "You don't have permission to decline loans." }
    }

    // Fetch the loan and verify it exists
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', id)
      .single()

    if (loanError || !loan) {
      return { error: "Loan not found." }
    }

    // Only pending loans can be declined
    if (loan.status !== "pending") {
      return { error: "Only pending loans can be declined." }
    }

    // Fetch member contact info and SACCO language settings in parallel
    const [{ data: member }, { data: saccoLang }] = await Promise.all([
      supabaseAdmin.from('members').select('phone, full_name').eq('id', loan.member_id).single(),
      supabaseAdmin.from('saccos').select('settings').eq('id', loan.sacco_id).single(),
    ])

    // Update loan status to declined with the provided reason
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

    // Notify the member — SMS failure is non-fatal
    if (member?.phone) {
      try {
        const saccoSettings = parseSaccoSettings(saccoLang?.settings)
        const templates = getSmsTemplates(saccoSettings?.sms?.language)
        await sendSmsOrQueue({
          to: member.phone,
          message: templates.loanDeclined(member.full_name, reason),
        })
      } catch (smsError) {
        console.error("[Loan] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to decline loan." }
  }
}

/**
 * Disburses an approved loan by initiating a Flutterwave transfer and
 * updating the loan status to "disbursed".
 * Only admins and cashiers can disburse.
 * The status update only happens AFTER the transfer succeeds so we
 * never mark a loan as disbursed if the money didn't actually move.
 */
export async function disburseLoanAction(id: string): Promise<LoanFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }
    if (!(LOAN_MANAGEMENT_ROLES as readonly string[]).includes(user.role)) {
      return { error: "You don't have permission to disburse loans." }
    }

    // Fetch the loan and verify it exists
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

    // Fetch member contact and SACCO settings in parallel
    const [{ data: member }, { data: saccoLangDisb }] = await Promise.all([
      supabaseAdmin.from('members').select('phone, full_name').eq('id', loan.member_id).single(),
      supabaseAdmin.from('saccos').select('settings').eq('id', loan.sacco_id).single(),
    ])

    // Initiate Flutterwave transfer to the member's mobile money account
    // This runs BEFORE the status update so we never mark a loan as disbursed
    // if the payment fails.
    if (member?.phone) {
      try {
        const normalizedPhone = member.phone
          .replace(/\s+/g, "")
          .replace(/^\+/, "")
          .replace(/^0/, "256")

        // Detect network from phone prefix (MTN: 25675/25670, Airtel: others)
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
        return { error: "Payment transfer failed. Please retry or contact support." }
      }
    }

    // Payment succeeded — now update the loan status
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
      return { error: "Loan disbursed (payment sent) but status update failed. Contact support." }
    }

    // Record the disbursement transaction
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        sacco_id: user.saccoId,
        member_id: loan.member_id,
        type: "loan_disbursement",
        amount: loan.amount,
        narration: `Loan disbursement - ${loan.loan_ref}`,
        payment_method: member?.phone ? "flutterwave" : "cash",
      })

    if (transactionError) {
      console.error('Transaction creation error:', transactionError)
    }

    // Send SMS notification — non-fatal
    if (member?.phone) {
      try {
        const saccoSettings = parseSaccoSettings(saccoLangDisb?.settings)
        const templates = getSmsTemplates(saccoSettings?.sms?.language)
        await sendSmsOrQueue({
          to: member.phone,
          message: templates.loanDisbursed(
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
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to disburse loan." }
  }
}

/**
 * Records a loan repayment, optionally processing mobile money payment
 * via Flutterwave before updating the balance. If the full balance is cleared,
 * the loan is automatically marked as "settled".
 * Returns a receipt on success.
 */
export async function repayLoanAction(
  prevState: LoanFormState,
  formData: FormData
): Promise<LoanFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    // Parse and validate repayment amount (strips commas for user-friendly input)
    const id = formData.get("loan_id") as string
    const amountStr = (formData.get("amount") as string)?.replace(/,/g, "")
    const amount = Math.round(parseFloat(amountStr || "0") * 100)
    const payment_method = (formData.get("payment_method") as string) || "cash"

    if (!amountStr || isNaN(amount) || amount <= 0)
      return { error: "Valid amount required." }

    // Fetch the loan
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', id)
      .single()

    if (loanError || !loan) {
      return { error: "Loan not found." }
    }
    if (!(REPAYABLE_STATUSES as readonly string[]).includes(loan.status)) {
      return { error: "Loan must be disbursed to record repayments." }
    }

    // Fetch member and SACCO info in parallel for payment, SMS, and receipt
    const [{ data: member }, { data: sacco }] = await Promise.all([
      supabaseAdmin
        .from('members')
        .select('phone, full_name, member_code')
        .eq('id', loan.member_id)
        .single(),
      supabaseAdmin
        .from('saccos')
        .select('name, settings')
        .eq('id', user.saccoId)
        .single(),
    ])

    // Process mobile money payment via Flutterwave before recording the repayment
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

    // Calculate new balance and determine if the loan is fully settled
    const newBalance = Math.max(0, loan.balance - amount)
    const newStatus = newBalance === 0 ? "settled" : "active"

    // Update the loan balance and status
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

    // Create a transaction record for the repayment
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
    }

    // Send repayment confirmation SMS — non-fatal
    if (member?.phone) {
      try {
        const saccoSettings = parseSaccoSettings(sacco?.settings)
        const templates = getSmsTemplates(saccoSettings?.sms?.language)
        await sendSmsOrQueue({
          to: member.phone,
          message: templates.loanRepayment(
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

    // Return a receipt for the repayment
    return {
      success: true,
      receipt: {
        receiptRef: `REPAY-${Date.now()}`,
        type: "Loan Repayment",
        memberName: member?.full_name ?? "Unknown",
        memberCode: member?.member_code ?? undefined,
        amount: amount / 100,
        balanceAfter: newBalance / 100,
        paymentMethod: payment_method,
        narration: `Loan repayment — ${loan.loan_ref}`,
        performedBy: user.fullName,
        performedAt: new Date().toISOString(),
        saccoName: sacco?.name ?? undefined,
      },
    }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to record repayment." }
  }
}

/**
 * Adds a top-up to an existing active loan, increasing the balance owed.
 * Records the top-up in the loan_top_ups table and creates a corresponding
 * disbursement transaction.
 */
export async function topUpLoanAction(
  prevState: LoanFormState,
  formData: FormData
): Promise<LoanFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    // Parse and validate the top-up amount
    const id = formData.get("loan_id") as string
    const amountStr = (formData.get("amount") as string)?.replace(/,/g, "")
    const amount = Math.round(parseFloat(amountStr || "0") * 100)
    const reason = formData.get("reason") as string
    const payment_method = (formData.get("payment_method") as string) || "cash"
    const notes = formData.get("notes") as string

    if (!amountStr || isNaN(amount) || amount <= 0)
      return { error: "Valid amount required." }

    // Fetch the loan
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', id)
      .single()

    if (loanError || !loan) {
      return { error: "Loan not found." }
    }
    if (!(TOP_UP_ELIGIBLE_STATUSES as readonly string[]).includes(loan.status)) {
      return { error: "Loan must be active or disbursed to add top-up." }
    }

    // Fetch member contact info for SMS
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', loan.member_id)
      .single()

    // Insert the top-up record
    const { error: topUpError } = await supabaseAdmin
      .from('loan_top_ups')
      .insert({
        loan_id: id,
        amount,
        reason,
        payment_method: payment_method as any,
        notes,
        processed_by: user.userId,
      })

    if (topUpError) {
      console.error('Top-up creation error:', topUpError)
      return { error: "Failed to process loan top-up." }
    }

    // Increase the loan balance by the top-up amount
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

    // Record the additional disbursement transaction
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        sacco_id: user.saccoId,
        member_id: loan.member_id,
        type: "loan_disbursement",
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
    }

    // Send SMS notification — non-fatal
    if (member?.phone) {
      try {
        await sendSmsOrQueue({
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
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to process loan top-up." }
  }
}

/**
 * Soft-deletes a loan by setting deleted_at.
 * Only admin users are permitted.
 * Logs the action to the audit trail.
 */
export async function deleteLoanAction(id: string): Promise<LoanFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }
    if (user.role !== "admin") {
      return { error: "Only admins can delete loans." }
    }

    // Fetch loan reference for audit logging before deletion
    const { data: loan } = await supabaseAdmin
      .from('loans').select('loan_ref').eq('id', id).single()

    // Soft-delete by setting the deleted_at timestamp
    const { error } = await supabaseAdmin
      .from('loans')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: "Failed to delete loan." }

    // Log to audit trail — non-fatal
    const { logActivity } = await import("@/lib/activity-log")
    await logActivity({
      saccoId: user.saccoId, actorId: user.userId,
      actorName: user.fullName, actorRole: user.role,
      action: "delete", entity: "loan",
      entityId: id, entityRef: loan?.loan_ref,
      description: `Moved loan ${loan?.loan_ref ?? id} to recycle bin`,
    })

    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to delete loan." }
  }
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED ACTIONS:
//   addLoanAction(prevState, formData)      – create a new loan application
//   approveLoanAction(id)                   – approve + auto-disburse a pending loan
//   declineLoanAction(id, reason)           – decline a pending loan with reason
//   disburseLoanAction(id)                  – disburse an approved loan via Flutterwave
//   repayLoanAction(prevState, formData)    – record a repayment instalment
//   topUpLoanAction(prevState, formData)    – add a top-up to an active loan
//   deleteLoanAction(id)                    – soft-delete a loan
//
// EXPORTED TYPES:
//   LoanFormState  – { success?, error?, receipt?, fieldErrors? }
//
// KEY CONSTANTS:
//   CENTS_PER_UNIT             = 100
//   LOAN_MANAGEMENT_ROLES      = ["admin", "cashier"]
//   REPAYABLE_STATUSES         = ["disbursed", "active"]
//   TOP_UP_ELIGIBLE_STATUSES   = ["active", "disbursed"]
//   LOAN_REF_PREFIX            = "LN"
//
// KEY HELPERS:
//   parseSaccoSettings(raw)  – safely parse the SACCO settings JSON column
//
// RELATED FILES:
//   lib/auth.ts                       – getCurrentUser, role constants
//   lib/sms.ts                        – sendSms, getSmsTemplates
//   lib/payments/flutterwave.ts       – initiateFlutterwaveTransfer/Charge
//   lib/pdf/loan-calculator.ts        – calculateLoan, getInterestRateForAmount
//   lib/activity-log.ts               – logActivity (audit trail)
//   db/queries/loans.ts               – read-only loan queries
//   db/queries/guarantors.ts          – guarantor management

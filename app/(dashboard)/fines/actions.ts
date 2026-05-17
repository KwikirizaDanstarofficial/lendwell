"use server"

import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendSms, smsTemplates } from "@/lib/sms"
import {
  processPayment,
  normalizePhone,
  getMobileNetwork,
  calculateFlutterwaveCharge,
} from "@/lib/payments"
import { z } from "zod"

export type FineFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const fineSchema = z.object({
  member_id: z
    .string()
    .min(1, "Please select a member")
    .uuid("Invalid member selected"),
  category_id: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  reason: z.string().min(2, "Reason is required"),
  description: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  priority: z.string().default("normal"),
  due_date: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  notes: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
})

// ─── Add Fine ─────────────────────────────────────────────────────────────────

export async function addFineAction(
  prevState: FineFormState,
  formData: FormData
): Promise<FineFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    

    const member_id = formData.get("member_id") as string
    const amount = formData.get("amount") as string
    const reason = formData.get("reason") as string

    // Basic validation before Zod
    if (!member_id) return { error: "Please select a member" }
    if (!amount || isNaN(parseFloat(amount)))
      return { error: "Please enter a valid amount" }
    if (!reason || reason.trim().length < 2)
      return { error: "Please provide a reason (minimum 2 characters)" }

    const raw = {
      member_id,
      category_id: (formData.get("category_id") as string) || undefined,
      amount,
      reason,
      description: (formData.get("description") as string) || undefined,
      priority: (formData.get("priority") as string) || "normal",
      due_date: (formData.get("due_date") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    }

    const parsed = fineSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const amountInCents = Math.floor(parsed.data.amount * 100)
    const fine_ref = `FN-${Date.now()}`

    // Insert fine
    const { error: insertError } = await supabaseAdmin
      .from('fines')
      .insert({
        sacco_id: user.saccoId,
        member_id: parsed.data.member_id,
        category_id: parsed.data.category_id ?? null,
        fine_ref,
        amount: amountInCents,
        reason: parsed.data.reason,
        description: parsed.data.description ?? null,
        priority: parsed.data.priority ?? "normal",
        due_date: parsed.data.due_date ?? null,
        notes: parsed.data.notes ?? null,
        status: "pending",
      })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return { error: "Failed to add fine." }
    }

    // Get member for SMS notification
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', parsed.data.member_id)
      .single()

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: smsTemplates.fineIssued(
            member.full_name,
            `UGX ${(amountInCents / 100).toLocaleString()}`,
            parsed.data.reason
          ),
        })
      } catch (smsError) {
        console.error('SMS sending failed:', smsError)
        // Don't fail the fine creation if SMS fails
      }
    }

    revalidatePath("/fines")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add fine." }
  }
}

// ─── Mark Fine Paid ───────────────────────────────────────────────────────────

export async function markFinePaidAction(
  prevState: FineFormState,
  formData: FormData
): Promise<FineFormState> {
  try {
    

    const id = formData.get("fine_id") as string
    const payment_method = formData.get("payment_method") as string
    const payment_reference = formData.get("payment_reference") as string

    // Get the fine
    const { data: fine, error: fetchError } = await supabaseAdmin
      .from('fines')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !fine) {
      return { error: "Fine not found." }
    }

    // Get member for payment processing and SMS
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('phone, full_name, email')
      .eq('id', fine.member_id)
      .single()

    let finalReference = payment_reference
    let finalMethod = payment_method || "cash"

    if (
      (payment_method === "flutterwave" || payment_method === "mobile_money") &&
      member?.phone
    ) {
      const chargeAmount = fine.amount / 100
      const chargeFee = calculateFlutterwaveCharge(chargeAmount)

      const paymentResult = await processPayment({
        phone_number: member.phone,
        amount: chargeAmount + chargeFee,
        email: member.email || undefined,
        fullname: member.full_name,
        tx_ref: `FINE-${fine.id}-${Date.now()}`,
        narration: `Fine payment - ${fine.fine_ref}`,
      })

      if (!paymentResult.success) {
        return {
          error: paymentResult.error || "Payment failed. Please try again.",
        }
      }

      finalReference =
        paymentResult.data?.data?.tx_ref || `FINE-${fine.id}-${Date.now()}`
      finalMethod = "flutterwave"
    }

    // Update fine status
    const { error: updateError } = await supabaseAdmin
      .from('fines')
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_method: finalMethod,
        payment_reference: finalReference || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return { error: "Failed to mark fine as paid." }
    }

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, your fine of UGX ${(fine.amount / 100).toLocaleString()} (Ref: ${fine.fine_ref}) has been paid. Thank you. - SACCO`,
        })
      } catch (smsError) {
        console.error('SMS sending failed:', smsError)
        // Don't fail the payment update if SMS fails
      }
    }

    revalidatePath("/fines")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to mark fine as paid." }
  }
}

// ─── Waive Fine ───────────────────────────────────────────────────────────────

export async function waiveFineAction(
  id: string,
  waiver_reason: string
): Promise<FineFormState> {
  try {
    

    // Get the fine
    const { data: fine, error: fetchError } = await supabaseAdmin
      .from('fines')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !fine) {
      return { error: "Fine not found." }
    }

    // Update fine status
    const { error: updateError } = await supabaseAdmin
      .from('fines')
      .update({
        status: "waived",
        waiver_reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return { error: "Failed to waive fine." }
    }

    // Get member for SMS notification
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', fine.member_id)
      .single()

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, your fine of UGX ${(fine.amount / 100).toLocaleString()} (Ref: ${fine.fine_ref}) has been waived. Reason: ${waiver_reason}. - SACCO`,
        })
      } catch (smsError) {
        console.error('SMS sending failed:', smsError)
        // Don't fail the waiver if SMS fails
      }
    }

    revalidatePath("/fines")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to waive fine." }
  }
}

// ─── Delete Fine ──────────────────────────────────────────────────────────────

export async function deleteFineAction(id: string): Promise<FineFormState> {
  try {
    

    const { error } = await supabaseAdmin
      .from('fines')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      return { error: "Failed to delete fine." }
    }

    revalidatePath("/fines")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete fine." }
  }
}

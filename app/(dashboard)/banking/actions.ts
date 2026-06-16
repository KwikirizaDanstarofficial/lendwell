"use server"

import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export type BankingFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const accountSchema = z.object({
  bank_name: z.string().min(1, "Bank name is required"),
  account_name: z.string().min(1, "Account name is required"),
  account_number: z.string().min(1, "Account number is required"),
  branch: z.string().optional().transform((v) => (v === "" ? undefined : v)),
  is_active: z.coerce.boolean().default(true),
})

const transactionSchema = z.object({
  account_id: z.string().min(1, "Account is required"),
  type: z.enum(["deposit", "withdrawal"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().min(2, "Description is required"),
  reference: z.string().optional().transform((v) => (v === "" ? undefined : v)),
  receipt_url: z.string().optional().transform((v) => (v === "" ? undefined : v)),
  notes: z.string().optional().transform((v) => (v === "" ? undefined : v)),
})

export async function addBankAccountAction(prev: BankingFormState, formData: FormData): Promise<BankingFormState> {
  const user = await getCurrentUser()
  if (!user?.saccoId) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = accountSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }

  const { error } = await supabaseAdmin.from("sacco_bank_accounts").insert({
    sacco_id: user.saccoId,
    bank_name: parsed.data.bank_name,
    account_name: parsed.data.account_name,
    account_number: parsed.data.account_number,
    branch: parsed.data.branch,
    is_active: parsed.data.is_active,
  })

  if (error) return { error: error.message }
  revalidatePath("/banking")
  return { success: true }
}

export async function updateBankAccountAction(prev: BankingFormState, formData: FormData): Promise<BankingFormState> {
  const user = await getCurrentUser()
  if (!user?.saccoId) return { error: "Not authenticated" }

  const id = formData.get("id") as string
  if (!id) return { error: "Account ID is required" }

  const raw = Object.fromEntries(formData)
  const parsed = accountSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }

  const { error } = await supabaseAdmin
    .from("sacco_bank_accounts")
    .update({
      bank_name: parsed.data.bank_name,
      account_name: parsed.data.account_name,
      account_number: parsed.data.account_number,
      branch: parsed.data.branch,
      is_active: parsed.data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("sacco_id", user.saccoId)

  if (error) return { error: error.message }
  revalidatePath("/banking")
  return { success: true }
}

export async function deleteBankAccountAction(id: string) {
  const user = await getCurrentUser()
  if (!user?.saccoId) return { error: "Not authenticated" }

  const { error } = await supabaseAdmin.from("sacco_bank_accounts").delete().eq("id", id).eq("sacco_id", user.saccoId)
  if (error) return { error: error.message }
  revalidatePath("/banking")
  return { success: true }
}

export async function addBankingTransactionAction(prev: BankingFormState, formData: FormData): Promise<BankingFormState> {
  const user = await getCurrentUser()
  if (!user?.saccoId) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = transactionSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }

  const amountCents = Math.round(parsed.data.amount * 100)

  const { error } = await supabaseAdmin.from("sacco_banking").insert({
    sacco_id: user.saccoId,
    account_id: parsed.data.account_id,
    type: parsed.data.type,
    amount: amountCents,
    description: parsed.data.description,
    reference: parsed.data.reference,
    receipt_url: parsed.data.receipt_url,
    transacted_by: user.userId,
    notes: parsed.data.notes,
  })

  if (error) return { error: error.message }
  revalidatePath("/banking")
  return { success: true }
}

export async function deleteBankingTransactionAction(id: string) {
  const user = await getCurrentUser()
  if (!user?.saccoId) return { error: "Not authenticated" }

  const { error } = await supabaseAdmin.from("sacco_banking").delete().eq("id", id).eq("sacco_id", user.saccoId)
  if (error) return { error: error.message }
  revalidatePath("/banking")
  return { success: true }
}

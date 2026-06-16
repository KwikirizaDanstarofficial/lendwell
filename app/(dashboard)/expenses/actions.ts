"use server"

import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export type ExpenseFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().min(2, "Description is required"),
  payment_method: z.string().default("cash"),
  reference: z.string().optional().transform((v) => (v === "" ? undefined : v)),
  paid_by: z.string().optional().transform((v) => (v === "" ? undefined : v)),
  paid_at: z.string().optional().transform((v) => (v === "" ? undefined : v)),
  notes: z.string().optional().transform((v) => (v === "" ? undefined : v)),
})

export async function addExpenseAction(prev: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  const user = await getCurrentUser()
  if (!user?.saccoId) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = expenseSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }

  const amountCents = Math.round(parsed.data.amount * 100)

  const { error } = await supabaseAdmin.from("expenses").insert({
    sacco_id: user.saccoId,
    category: parsed.data.category,
    amount: amountCents,
    description: parsed.data.description,
    payment_method: parsed.data.payment_method,
    reference: parsed.data.reference,
    paid_by: parsed.data.paid_by,
    paid_at: parsed.data.paid_at,
    notes: parsed.data.notes,
  })

  if (error) return { error: error.message }
  revalidatePath("/expenses")
  return { success: true }
}

export async function updateExpenseAction(prev: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  const user = await getCurrentUser()
  if (!user?.saccoId) return { error: "Not authenticated" }

  const id = formData.get("id") as string
  if (!id) return { error: "Expense ID is required" }

  const raw = Object.fromEntries(formData)
  const parsed = expenseSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }

  const amountCents = Math.round(parsed.data.amount * 100)

  const { error } = await supabaseAdmin
    .from("expenses")
    .update({
      category: parsed.data.category,
      amount: amountCents,
      description: parsed.data.description,
      payment_method: parsed.data.payment_method,
      reference: parsed.data.reference,
      paid_by: parsed.data.paid_by,
      paid_at: parsed.data.paid_at,
      notes: parsed.data.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("sacco_id", user.saccoId)

  if (error) return { error: error.message }
  revalidatePath("/expenses")
  return { success: true }
}

export async function deleteExpenseAction(id: string) {
  const user = await getCurrentUser()
  if (!user?.saccoId) return { error: "Not authenticated" }

  const { error } = await supabaseAdmin.from("expenses").delete().eq("id", id).eq("sacco_id", user.saccoId)
  if (error) return { error: error.message }
  revalidatePath("/expenses")
  return { success: true }
}

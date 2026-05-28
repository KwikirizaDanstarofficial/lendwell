"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { sendSms } from "@/lib/sms"
import { generateEmail, generatePassword } from "@/lib/credentials"
import { z } from "zod"

export type UserFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const createSchema = z.object({
  full_name: z.string().min(2, "Full name required"),
  phone: z.string().min(9, "Valid phone number required"),
  role: z.enum(["admin", "cashier", "field_agent", "branch_admin"]),
  branch_id: z.string().optional(),
  notes: z.string().optional(),
})

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createUserAction(
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const actor = await getCurrentUser()
  if (!actor) return { error: "Not authenticated." }

  const roleToCreate = formData.get("role") as string

  if (actor.role === "cashier" && roleToCreate !== "field_agent") {
    return { error: "Cashiers can only create Field Agents." }
  }
  if (actor.role === "field_agent") {
    return { error: "Field Agents cannot create users." }
  }

  const raw = {
    full_name: formData.get("full_name") as string,
    phone: (formData.get("phone") as string)?.trim(),
    role: roleToCreate,
    branch_id: (formData.get("branch_id") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  }

  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: "Validation failed.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const email = generateEmail(parsed.data.full_name)
  const tempPassword = generatePassword()

  // For branch_admin, look up the branch code to embed in metadata (for URL routing)
  let branchCode: string | null = null
  if (parsed.data.role === "branch_admin" && parsed.data.branch_id) {
    const { data: br } = await supabaseAdmin
      .from("branches")
      .select("code")
      .eq("id", parsed.data.branch_id)
      .single()
    branchCode = br?.code ?? null
  }

  const { error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.full_name,
      role: parsed.data.role,
      sacco_id: actor.saccoId,
      branch_id: parsed.data.branch_id ?? null,
      branch_code: branchCode,
      phone: parsed.data.phone,
      notes: parsed.data.notes ?? null,
      has_temp_password: true,
      created_by: actor.userId,
    },
  })

  if (authError) return { error: authError.message }

  // Send credentials via SMS (non-blocking)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "the portal"
  sendSms({
    to: parsed.data.phone,
    message: `Your SACCO staff account has been created.\nEmail: ${email}\nPassword: ${tempPassword}\nLogin at: ${appUrl}\nChange your password after signing in.`,
  }).catch((err) => console.error("[CREATE USER] SMS error:", err))

  revalidatePath("/users")
  return { success: true }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateUserAction(
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const actor = await getCurrentUser()
  if (!actor) return { error: "Not authenticated." }
  if (actor.role !== "admin") return { error: "Only admins can edit users." }

  const id = formData.get("id") as string

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    user_metadata: {
      full_name: formData.get("full_name") as string,
      role: formData.get("role") as string,
      branch_id: (formData.get("branch_id") as string) || null,
      phone: (formData.get("phone") as string) || null,
      notes: (formData.get("notes") as string) || null,
      sacco_id: actor.saccoId,
    },
  })

  if (error) return { error: error.message }

  revalidatePath("/users")
  return { success: true }
}

// ─── Toggle Active ────────────────────────────────────────────────────────────

export async function toggleUserActiveAction(
  id: string,
  isActive: boolean
): Promise<UserFormState> {
  const actor = await getCurrentUser()
  if (!actor) return { error: "Not authenticated." }
  if (actor.role !== "admin") return { error: "Only admins can do this." }
  if (id === actor.userId) return { error: "You cannot deactivate yourself." }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    ban_duration: isActive ? "none" : "876600h",
  })

  if (error) return { error: error.message }

  revalidatePath("/users")
  return { success: true }
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPasswordAction(
  id: string,
  newPassword: string
): Promise<UserFormState> {
  const actor = await getCurrentUser()
  if (!actor) return { error: "Not authenticated." }
  if (actor.role !== "admin") return { error: "Only admins can reset passwords." }
  if (newPassword.length < 8) return { error: "Password must be at least 8 characters." }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    password: newPassword,
    user_metadata: { must_change_password: true },
  })

  if (error) return { error: error.message }

  revalidatePath("/users")
  return { success: true }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteUserAction(id: string): Promise<UserFormState> {
  const actor = await getCurrentUser()
  if (!actor) return { error: "Not authenticated." }
  if (actor.role !== "admin") return { error: "Only admins can delete users." }
  if (id === actor.userId) return { error: "You cannot delete your own account." }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (error) return { error: error.message }

  revalidatePath("/users")
  return { success: true }
}

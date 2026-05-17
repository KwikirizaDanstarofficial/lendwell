"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"

export type UserFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const createSchema = z.object({
  full_name: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  role: z.enum(["admin", "cashier", "field_agent"]),
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
    email: ((formData.get("email") as string) ?? "").trim().toLowerCase(),
    password: formData.get("password") as string,
    phone: (formData.get("phone") as string) || undefined,
    role: roleToCreate,
    notes: (formData.get("notes") as string) || undefined,
  }

  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.full_name,
      role: parsed.data.role,
      sacco_id: actor.saccoId,
      phone: parsed.data.phone ?? null,
      notes: parsed.data.notes ?? null,
      must_change_password: true,
      created_by: actor.userId,
    },
  })

  if (authError) {
    if (authError.message.toLowerCase().includes("already been registered")) {
      return { error: "A user with this email already exists." }
    }
    return { error: authError.message }
  }

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

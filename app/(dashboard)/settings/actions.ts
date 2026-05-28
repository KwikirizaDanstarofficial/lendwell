"use server"

import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { STORAGE_BUCKETS } from "@/lib/supabase/storage"
import { revalidatePath } from "next/cache"
import { createBranch, updateBranch, deleteBranch } from "@/db/queries/branches"
import { logActivity } from "@/lib/activity-log"

export type SettingsState = {
  success?: boolean
  error?: string
  url?: string
}

// ─── Update General Settings ──────────────────────────────────────────────────

export async function updateGeneralSettingsAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    

    const { error } = await supabaseAdmin
      .from('saccos')
      .update({
        name: formData.get("name") as string,
        contact_email: (formData.get("contact_email") as string) || null,
        contact_phone: (formData.get("contact_phone") as string) || null,
        address: (formData.get("address") as string) || null,
        tagline: (formData.get("tagline") as string) || null,
        primary_color: (formData.get("primary_color") as string) || "#16a34a",
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.saccoId)

    if (error) throw error

    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to update settings." }
  }
}

// ─── Upload Logo ──────────────────────────────────────────────────────────────

export async function uploadLogoAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    const file = formData.get("logo") as File
    if (!file) return { error: "No file provided." }

    const ext = file.name.split('.').pop()
    const filename = `${user.saccoId}-logo.${ext}`

    // Ensure logos bucket exists (auto-create if missing)
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === STORAGE_BUCKETS.LOGOS)
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(STORAGE_BUCKETS.LOGOS, {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
        fileSizeLimit: 2 * 1024 * 1024,
      })
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.LOGOS)
      .upload(filename, file, { upsert: true, contentType: file.type })

    if (uploadError) throw new Error(uploadError.message)

    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKETS.LOGOS)
      .getPublicUrl(filename)

    const publicUrl = urlData.publicUrl

    
    const { error } = await supabaseAdmin
      .from('saccos')
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.saccoId)

    if (error) throw error

    revalidatePath("/settings")
    return { success: true, url: publicUrl }
  } catch (err) {
    console.error(err)
    return { error: "Failed to upload logo." }
  }
}

// ─── Add Interest Rate ────────────────────────────────────────────────────────

export async function addInterestRateAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    const min = parseInt(formData.get("min_amount") as string) * 100
    const max = parseInt(formData.get("max_amount") as string) * 100
    const rate = formData.get("rate") as string
    const rate_type = formData.get("rate_type") as "daily" | "monthly" | "annual"

    if (min >= max) return { error: "Min amount must be less than max amount." }

    
    const { error } = await supabaseAdmin
      .from('interest_rates')
      .insert({ sacco_id: user.saccoId, min_amount: min, max_amount: max, rate, rate_type })

    if (error) throw error

    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add interest rate." }
  }
}

// ─── Delete Interest Rate ─────────────────────────────────────────────────────

export async function deleteInterestRateAction(id: string): Promise<SettingsState> {
  try {
    
    const { error } = await supabaseAdmin.from('interest_rates').delete().eq('id', id)
    if (error) throw error
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete interest rate." }
  }
}

// ─── Add Loan Category ────────────────────────────────────────────────────────

export async function addLoanCategoryAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    
    const { error } = await supabaseAdmin.from('loan_categories').insert({
      sacco_id: user.saccoId,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      min_amount: parseInt(formData.get("min_amount") as string) * 100 || 0,
      max_amount: parseInt(formData.get("max_amount") as string) * 100,
      interest_rate: (formData.get("interest_rate") as string) || "0",
      max_duration_months: parseInt(formData.get("max_duration_months") as string) || 12,
      requires_guarantor: formData.get("requires_guarantor") === "true",
    })

    if (error) throw error
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add loan category." }
  }
}

// ─── Delete Loan Category ─────────────────────────────────────────────────────

export async function deleteLoanCategoryAction(id: string): Promise<SettingsState> {
  try {
    
    const { error } = await supabaseAdmin.from('loan_categories').delete().eq('id', id)
    if (error) throw error
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete loan category." }
  }
}

// ─── Add Savings Category ─────────────────────────────────────────────────────

export async function addSavingsCategoryAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    
    const { error } = await supabaseAdmin.from('savings_categories').insert({
      sacco_id: user.saccoId,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      interest_rate: (formData.get("interest_rate") as string) || "0",
      is_fixed: formData.get("is_fixed") === "true",
    })

    if (error) throw error
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add savings category." }
  }
}

// ─── Delete Savings Category ──────────────────────────────────────────────────

export async function deleteSavingsCategoryAction(id: string): Promise<SettingsState> {
  try {
    
    const { error } = await supabaseAdmin.from('savings_categories').delete().eq('id', id)
    if (error) throw error
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete savings category." }
  }
}

// ─── Add Fine Category ────────────────────────────────────────────────────────

export async function addFineCategoryAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    
    const { error } = await supabaseAdmin.from('fine_categories').insert({
      sacco_id: user.saccoId,
      name: formData.get("name") as string,
      default_amount: parseInt(formData.get("default_amount") as string) * 100 || 0,
    })

    if (error) throw error
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add fine category." }
  }
}

// ─── Delete Fine Category ─────────────────────────────────────────────────────

export async function deleteFineCategoryAction(id: string): Promise<SettingsState> {
  try {
    
    const { error } = await supabaseAdmin.from('fine_categories').delete().eq('id', id)
    if (error) throw error
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete fine category." }
  }
}

// ─── Update Payment Settings ──────────────────────────────────────────────────

export async function updatePaymentSettingsAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('saccos')
      .select('settings')
      .eq('id', user.saccoId)
      .single()

    if (fetchError) throw fetchError

    const currentSettings = (() => {
      try { return JSON.parse(existing?.settings ?? "{}") } catch { return {} }
    })()

    const newSettings = {
      ...currentSettings,
      payments: {
        mtn_enabled: formData.get("mtn_enabled") === "true",
        airtel_enabled: formData.get("airtel_enabled") === "true",
        flutterwave_enabled: formData.get("flutterwave_enabled") === "true",
        default_method: formData.get("default_method") as string,
      },
      sms: {
        provider: formData.get("sms_provider") as string,
        sender_id: formData.get("sender_id") as string,
        language: (formData.get("sms_language") as string) || "english",
      },
    }

    const { error } = await supabaseAdmin
      .from('saccos')
      .update({ settings: JSON.stringify(newSettings), updated_at: new Date().toISOString() })
      .eq('id', user.saccoId)

    if (error) throw error

    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to update payment settings." }
  }
}

// ─── Test Flutterwave Charge ──────────────────────────────────────────────────

export async function testFlutterwaveChargeAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const phone = formData.get("phone") as string
    const amount = parseInt(formData.get("amount") as string) * 100

    if (!phone || !amount) return { error: "Phone and amount required." }

    const { initiateFlutterwaveCharge } = await import("@/lib/payments/flutterwave")

    await initiateFlutterwaveCharge({
      phone_number: phone,
      amount: amount / 100,
      currency: "UGX",
      tx_ref: `TEST-CHARGE-${Date.now()}`,
      narration: "Test payment charge",
      fullname: "Test User",
    })

    return { success: true }
  } catch (err) {
    console.error("Test charge failed:", err)
    return { error: err instanceof Error ? err.message : "Test charge failed" }
  }
}

// ─── Test Flutterwave Transfer ────────────────────────────────────────────────

export async function testFlutterwaveTransferAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const phone = formData.get("phone") as string
    const amount = parseInt(formData.get("amount") as string) * 100

    if (!phone || !amount) return { error: "Phone and amount required." }

    const { initiateFlutterwaveTransfer } = await import("@/lib/payments/flutterwave")

    const normalizedPhone = phone
      .replace(/\s+/g, "")
      .replace(/^\+/, "")
      .replace(/^0/, "256")
    const account_bank =
      normalizedPhone.startsWith("25675") || normalizedPhone.startsWith("25670")
        ? "MPS"
        : "ATL"

    await initiateFlutterwaveTransfer({
      account_bank,
      account_number: normalizedPhone,
      amount: amount / 100,
      currency: "UGX",
      narration: "Test payment transfer",
      reference: `TEST-TRANSFER-${Date.now()}`,
      beneficiary_name: "Test User",
    })

    return { success: true }
  } catch (err) {
    console.error("Test transfer failed:", err)
    return { error: err instanceof Error ? err.message : "Test transfer failed" }
  }
}

// ─── Branch Actions ───────────────────────────────────────────────────────────

function generateBranchCode(name: string, existingCodes: string[]): string {
  const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3).padEnd(3, "X")
  let n = 1
  let code: string
  do { code = `${prefix}${String(n).padStart(2, "0")}` } while (existingCodes.includes(code) && ++n)
  return code
}

export async function createBranchAction(payload: {
  name: string
  address?: string
  phone?: string
  email?: string
  managerId?: string
}): Promise<SettingsState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (user.role !== "admin") return { error: "Only admins can manage branches" }

  try {
    const { data: existing } = await supabaseAdmin
      .from("branches")
      .select("code")
      .eq("sacco_id", user.saccoId)

    const existingCodes = (existing ?? []).map((b) => b.code)
    const code = generateBranchCode(payload.name, existingCodes)

    const branch = await createBranch({ saccoId: user.saccoId, code, ...payload })
    await logActivity({
      saccoId: user.saccoId, actorId: user.userId, actorName: user.fullName, actorRole: user.role,
      action: "create", entity: "branches" as any,
      entityId: branch.id, entityRef: branch.code,
      description: `Created branch "${branch.name}" (${branch.code})`,
    })
    revalidatePath("/settings")
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function updateBranchAction(
  id: string,
  payload: {
    name?: string
    code?: string
    address?: string | null
    phone?: string | null
    email?: string | null
    managerId?: string | null
    isActive?: boolean
  }
): Promise<SettingsState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (user.role !== "admin") return { error: "Only admins can manage branches" }

  try {
    await updateBranch(id, payload)
    await logActivity({
      saccoId: user.saccoId, actorId: user.userId, actorName: user.fullName, actorRole: user.role,
      action: "update", entity: "branches" as any,
      entityId: id, entityRef: payload.code ?? "",
      description: `Updated branch "${payload.name ?? id}"`,
    })
    revalidatePath("/settings")
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function deleteBranchAction(id: string): Promise<SettingsState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Unauthorized" }
  if (user.role !== "admin") return { error: "Only admins can delete branches" }

  try {
    await deleteBranch(id)
    await logActivity({
      saccoId: user.saccoId, actorId: user.userId, actorName: user.fullName, actorRole: user.role,
      action: "delete", entity: "branches" as any,
      entityId: id, entityRef: "",
      description: `Deleted branch ${id}`,
    })
    revalidatePath("/settings")
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

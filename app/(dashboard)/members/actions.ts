"use server"
import { isOfflineError } from "@/lib/offline-safe"
/**
 * app/(dashboard)/members/actions.ts
 *
 * Server actions for member CRUD operations in the SACCO application.
 * Each action runs on the server and orchestrates:
 *   – Authentication and role-based authorisation
 *   – Input validation via Zod
 *   – Database writes via the Supabase admin client
 *   – Photo uploads to Supabase Storage
 *   – Portal login credential creation via Supabase Auth
 *   – SMS notifications to members
 *   – Audit log entries
 *   – Next.js cache revalidation
 */

import { supabaseAdmin } from "@/lib/supabase/server"
import { STORAGE_BUCKETS } from "@/lib/supabase/storage"
import { revalidatePath } from "next/cache"
import { generateMemberCode, generateMemberCodes } from "@/lib/member-code"
import { sendSmsOrQueue, sendSms, getSmsTemplates } from "@/lib/sms"
import { getCurrentUser } from "@/lib/auth"
import { generateEmail, generatePassword } from "@/lib/credentials"
import { z } from "zod"
import { calculateLoan } from "@/lib/pdf/loan-calculator"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Multiplier to convert major currency units (UGX) to stored minor units. */
const CENTS_PER_UNIT = 100

/** Maximum file size allowed for member photo uploads (5 MB). */
const PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024

/** MIME types accepted for member photo uploads. */
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

/** Roles allowed to create and edit member records. */
const MEMBER_MANAGEMENT_ROLES = ["admin", "cashier", "field_agent", "branch_admin"] as const

/** Number of recent transactions shown on the member detail page. */
const RECENT_TRANSACTIONS_LIMIT = 20

/** Loan reference prefix for quick-assign loans created from the member page. */
const LOAN_REF_PREFIX = "LN"

/** Savings account number prefix for auto-created accounts. */
const SAVINGS_ACCOUNT_PREFIX = "SAV"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely parse the SACCO settings JSON column.
 * Returns an empty object when the value is null or malformed JSON.
 */
function parseSaccoSettings(raw: string | null | undefined): Record<string, any> {
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Zod schema for validating member create/update form input.
 * Empty string values for optional fields are transformed to undefined/null
 * so they are stored as NULL in the database.
 */
const memberSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(9, "Valid phone number required"),
  national_id: z.string().min(5, "National ID is required"),
  date_of_birth: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  address: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  next_of_kin: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  next_of_kin_phone: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  next_of_kin_relationship: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  next_of_kin_address: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  status: z.enum(["active", "suspended", "exited"]).default("active"),
  photo_url: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (!v || v === "" ? null : v)),
})

/** Standard return type for member server actions. */
export type MemberFormState = {
  success?: boolean
  offlineSaved?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

/**
 * Ensures the avatars storage bucket exists in Supabase.
 * Creates it on first use with appopriate constraints (public, image-only, 5MB max).
 */
async function ensureAvatarsBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const exists = buckets?.some((b) => b.name === STORAGE_BUCKETS.AVATARS)
  if (!exists) {
    await supabaseAdmin.storage.createBucket(STORAGE_BUCKETS.AVATARS, {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      fileSizeLimit: 5 * 1024 * 1024,
    })
  }
}

/**
 * Uploads a member photo to Supabase Storage and returns the public URL.
 * Validates file type and size before uploading.
 * Returns null if the upload fails (caller handles gracefully).
 */
async function uploadMemberPhoto(
  photoFile: File,
  saccoId: string,
  memberCode: string
): Promise<string | null> {
  try {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!(ALLOWED_PHOTO_TYPES as readonly string[]).includes(photoFile.type)) {
      throw new Error("Only JPG, PNG, and WEBP images are allowed")
    }

    if (photoFile.size > PHOTO_MAX_SIZE_BYTES) {
      throw new Error("Image must be less than 5MB")
    }

    await ensureAvatarsBucket()

    const ext = photoFile.name.split(".").pop() || "jpg"
    const filename = `${saccoId}/${memberCode}/photo-${Date.now()}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .upload(filename, photoFile, { upsert: true })

    if (uploadError) throw new Error(uploadError.message)

    const { data } = supabaseAdmin.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .getPublicUrl(filename)

    return data.publicUrl
  } catch (error) {
    console.error("Photo upload failed:", error)
    return null
  }
}

/**
 * Creates a new member record, uploads their photo (if provided), auto-creates
 * portal login credentials, and sends a welcome SMS with the portal URL and
 * member code. The password is NOT sent via SMS for security — instead the
 * member is directed to use the "forgot password" flow.
 *
 * Allowed roles: admin, cashier, field_agent, branch_admin.
 */
export async function addMemberAction(
  prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    if (!(MEMBER_MANAGEMENT_ROLES as readonly string[]).includes(user.role)) {
      console.log(
        `Permission denied: User ${user.email} (role: ${user.role}) attempted to add a member`
      )
      return { error: "You don't have permission to add members" }
    }

    // Generate a unique member code using the SACCO-specific prefix and sequence
    const member_code = await generateMemberCode(user.saccoId)

    // Upload photo if one was provided in the form
    let photo_url = null
    const photoFile = formData.get("photo") as File | null
    if (photoFile && photoFile instanceof File && photoFile.size > 0) {
      photo_url = await uploadMemberPhoto(photoFile, user.saccoId, member_code)
    }

    const branchId = (formData.get("branch_id") as string) || null

    // Collect raw form data for validation
    const raw = {
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      national_id: formData.get("national_id") as string,
      date_of_birth: formData.get("date_of_birth") as string,
      address: formData.get("address") as string,
      next_of_kin: formData.get("next_of_kin") as string,
      next_of_kin_relationship: formData.get(
        "next_of_kin_relationship"
      ) as string,
      next_of_kin_phone: formData.get("next_of_kin_phone") as string,
      next_of_kin_address: formData.get("next_of_kin_address") as string,
      status: (formData.get("status") as string) || "active",
      photo_url: photo_url || undefined,
    }

    const parsed = memberSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    // Insert the member record
    const { error: insertError } = await supabaseAdmin
      .from('members')
      .insert({
        member_code,
        sacco_id: user.saccoId,
        full_name: parsed.data.full_name,
        email: parsed.data.email || null,
        phone: parsed.data.phone,
        national_id: parsed.data.national_id,
        date_of_birth: parsed.data.date_of_birth || null,
        address: parsed.data.address || null,
        next_of_kin: parsed.data.next_of_kin || null,
        next_of_kin_relationship: parsed.data.next_of_kin_relationship || null,
        next_of_kin_phone: parsed.data.next_of_kin_phone || null,
        next_of_kin_address: parsed.data.next_of_kin_address || null,
        status: parsed.data.status,
        photo_url: parsed.data.photo_url || null,
        branch_id: branchId,
      })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return { error: insertError.message || "Failed to add member. Please try again." }
    }

    // Auto-create portal login credentials for the member
    // Password is NOT sent via SMS — member must use "forgot password" flow
    const memberEmail = generateEmail(parsed.data.full_name)
    const memberPassword = generatePassword()

    const { error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: memberEmail,
      password: memberPassword,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        role: "member",
        sacco_id: user.saccoId,
        member_code,
        has_temp_password: true,
      },
    })

    if (authError) {
      console.error("[Member] Auth user creation failed:", authError)
    }

    // Send welcome SMS with portal URL and member code only.
    // The password is excluded for security — members use the forgot-password flow.
    if (parsed.data.phone) {
      try {
        const { data: saccoForWelcome } = await supabaseAdmin.from('saccos').select('settings').eq('id', user.saccoId).single()
        const saccoSettings = parseSaccoSettings(saccoForWelcome?.settings)
        const appUrl = process.env.APP_URL ?? ""
        const welcomeMsg = getSmsTemplates(saccoSettings?.sms?.language).welcome(parsed.data.full_name, member_code)
        const portalInfo = `\nPortal: ${appUrl}/portal\nUse your email and the forgot-password link to set your password.`
        sendSmsOrQueue({
          to: parsed.data.phone,
          message: welcomeMsg + portalInfo,
        }).catch((err) => console.error("[Member] SMS error:", err))
      } catch (smsError) {
        console.error("[Member] SMS failed:", smsError)
      }
    }

    revalidatePath("/members")
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to add member. Please try again." }
  }
}

/**
 * Updates an existing member's profile.
 * Only admins can edit members.
 * If the phone number changes and the new number is provided, an SMS notification
 * is sent to the new number. Photo replacement is handled separately.
 */
export async function editMemberAction(
  id: string,
  prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    if (user.role !== "admin") {
      return { error: "You don't have permission to edit members" }
    }

    // Fetch the existing member to compare values and preserve the photo if not replaced
    const { data: existingMember, error: memberError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (memberError || !existingMember) {
      return { error: "Member not found" }
    }

    // Handle photo replacement — keep the old one unless a new file is uploaded
    let photo_url = existingMember.photo_url
    const photoFile = formData.get("photo") as File | null
    if (photoFile && photoFile instanceof File && photoFile.size > 0) {
      photo_url = await uploadMemberPhoto(
        photoFile,
        user.saccoId,
        existingMember.member_code
      )
    }

    const raw = {
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      national_id: formData.get("national_id") as string,
      date_of_birth: formData.get("date_of_birth") as string,
      address: formData.get("address") as string,
      next_of_kin: formData.get("next_of_kin") as string,
      next_of_kin_relationship: formData.get(
        "next_of_kin_relationship"
      ) as string,
      next_of_kin_phone: formData.get("next_of_kin_phone") as string,
      next_of_kin_address: formData.get("next_of_kin_address") as string,
      status: (formData.get("status") as string) || "active",
      photo_url: photo_url,
    }

    const parsed = memberSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    // Perform the update
    const { error: updateError } = await supabaseAdmin
      .from('members')
      .update({
        full_name: parsed.data.full_name,
        email: parsed.data.email || null,
        phone: parsed.data.phone,
        national_id: parsed.data.national_id,
        date_of_birth: parsed.data.date_of_birth || null,
        address: parsed.data.address || null,
        next_of_kin: parsed.data.next_of_kin || null,
        next_of_kin_relationship: parsed.data.next_of_kin_relationship || null,
        next_of_kin_phone: parsed.data.next_of_kin_phone || null,
        next_of_kin_address: parsed.data.next_of_kin_address || null,
        status: parsed.data.status,
        photo_url: parsed.data.photo_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return { error: "Failed to update member. Please try again." }
    }

    // Notify the member if their phone number changed — non-fatal
    if (parsed.data.phone && parsed.data.phone !== existingMember.phone) {
      try {
        await sendSmsOrQueue({
          to: parsed.data.phone,
          message: `Dear ${parsed.data.full_name}, your SACCO profile has been updated. Member code: ${existingMember.member_code}. - SACCO`,
        })
      } catch (smsError) {
        console.error('SMS sending failed:', smsError)
      }
    }

    revalidatePath("/members")
    revalidatePath(`/members/${id}`)
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to update member. Please try again." }
  }
}

/**
 * Soft-deletes a member by setting deleted_at, but only after checking
 * that the member has no active loans, savings balances, or pending fines.
 * Only admins can delete members. The action is logged to the audit trail.
 *
 * Member is moved to the recycle bin — not hard-deleted.
 */
export async function deleteMemberAction(id: string): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    if (user.role !== "admin") {
      return { error: "You don't have permission to delete members" }
    }

    // Verify the member exists
    const { data: existing, error: memberError } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('id', id)
      .single()

    if (memberError || !existing) {
      return { error: "Member not found." }
    }

    // Check for active loans, savings, and pending fines in parallel
    const [
      { data: memberLoans, error: loansError },
      { data: memberSavings, error: savingsError },
      { data: memberFines, error: finesError },
    ] = await Promise.all([
      supabaseAdmin.from('loans').select('status').eq('member_id', id),
      supabaseAdmin.from('savings_accounts').select('balance').eq('member_id', id),
      supabaseAdmin.from('fines').select('status').eq('member_id', id),
    ])

    if (loansError) {
      console.error('Error checking member loans:', loansError)
      return { error: "Failed to check member loans." }
    }
    if (savingsError) {
      console.error('Error checking member savings:', savingsError)
      return { error: "Failed to check member savings." }
    }
    if (finesError) {
      console.error('Error checking member fines:', finesError)
      return { error: "Failed to check member fines." }
    }

    // Guard: prevent deletion if the member has financial exposure
    const hasActiveLoans = memberLoans?.some((l) =>
      ["active", "disbursed", "pending"].includes(l.status)
    )
    const hasSavings = memberSavings?.some((s) => s.balance > 0)
    const hasPendingFines = memberFines?.some((f) => f.status === "pending")

    if (hasActiveLoans) {
      return {
        error: "Cannot delete member with active loans. Settle loans first.",
      }
    }
    if (hasSavings) {
      return {
        error:
          "Cannot delete member with savings balance. Withdraw funds first.",
      }
    }
    if (hasPendingFines) {
      return {
        error:
          "Cannot delete member with pending fines. Pay or waive fines first.",
      }
    }

    // Fetch member info for the audit log before deleting
    const { data: memberData } = await supabaseAdmin
      .from('members').select('full_name, member_code').eq('id', id).single()

    // Soft-delete by setting deleted_at timestamp
    const { error: deleteError } = await supabaseAdmin
      .from('members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting member:', deleteError)
      return { error: "Failed to delete member." }
    }

    // Record the action in the audit log
    const { logActivity } = await import("@/lib/activity-log")
    await logActivity({
      saccoId: user.saccoId, actorId: user.userId,
      actorName: user.fullName, actorRole: user.role,
      action: "delete", entity: "member",
      entityId: id, entityRef: memberData?.member_code,
      description: `Moved member ${memberData?.full_name ?? id} to recycle bin`,
    })

    revalidatePath("/members")
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to delete member." }
  }
}

/**
 * Updates a member's status (active/suspended/exited).
 * Only admins can change member status.
 * The member is notified via SMS when their status changes.
 */
export async function updateMemberStatusAction(
  id: string,
  status: "active" | "suspended" | "exited"
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    if (user.role !== "admin") {
      return { error: "You don't have permission to update member status" }
    }

    // Fetch the member to validate existence and get contact info
    const { data: existing, error: memberError } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', id)
      .single()

    if (memberError || !existing) {
      return { error: "Member not found." }
    }

    // Apply the status change
    const { error: updateError } = await supabaseAdmin
      .from('members')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating member status:', updateError)
      return { error: "Failed to update member status." }
    }

    // Notify the member of their status change — non-fatal
    if (existing.phone) {
      const messages = {
        active: `Dear ${existing.full_name}, your SACCO membership has been activated. Welcome back! - SACCO`,
        suspended: `Dear ${existing.full_name}, your SACCO membership has been suspended. Contact us for more info. - SACCO`,
        exited: `Dear ${existing.full_name}, your SACCO membership has been closed. Thank you for being with us. - SACCO`,
      }
      try {
        await sendSmsOrQueue({
          to: existing.phone,
          message: messages[status],
        })
      } catch (smsError) {
        console.error('SMS sending failed:', smsError)
      }
    }

    revalidatePath("/members")
    revalidatePath(`/members/${id}`)
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to update member status." }
  }
}

/**
 * Sends a custom SMS to a specific member.
 * Only admins and cashiers can use this action.
 * The message content and a delivery record are saved to the notifications table.
 */
export async function sendMemberSmsAction(
  id: string,
  message: string
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    if (!["admin", "cashier"].includes(user.role)) {
      return { error: "You don't have permission to send SMS to members" }
    }

    // Fetch the member and verify they belong to the same SACCO
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('phone')
      .eq('id', id)
      .eq('sacco_id', user.saccoId)
      .single()

    if (memberError || !member) {
      return { error: "Member not found." }
    }
    if (!member.phone) {
      return { error: "Member has no phone number." }
    }

    // Send the SMS
    try {
      await sendSmsOrQueue({ to: member.phone, message })
    } catch (smsError) {
      console.error('SMS sending failed:', smsError)
      return { error: "Failed to send SMS." }
    }

    // Record the sent message in the notifications table for the audit trail
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        sacco_id: user.saccoId,
        member_id: id,
        title: "SMS Sent",
        body: message,
        type: "sms",
        status: "sent",
        sent_at: new Date().toISOString(),
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to send SMS." }
  }
}

/**
 * Fetches comprehensive statistics for a single member, including loans,
 * savings accounts, fines, and recent transactions.
 * Returns formatted data with computed totals for display in the member detail view.
 */
export async function getMemberStatsAction(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    // Fetch all related data in parallel for performance
    const [
      { data: memberLoans, error: loansError },
      { data: memberSavings, error: savingsError },
      { data: memberFines, error: finesError },
      { data: memberTransactions, error: transactionsError },
    ] = await Promise.all([
      supabaseAdmin
        .from('loans')
        .select('*')
        .eq('member_id', id)
        .eq('sacco_id', user.saccoId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('savings_accounts')
        .select('*')
        .eq('member_id', id)
        .eq('sacco_id', user.saccoId),
      supabaseAdmin
        .from('fines')
        .select('*')
        .eq('member_id', id)
        .eq('sacco_id', user.saccoId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('member_id', id)
        .eq('sacco_id', user.saccoId)
        .order('created_at', { ascending: false })
        .limit(RECENT_TRANSACTIONS_LIMIT),
    ])

    // Return null on any individual query failure rather than partial data
    if (loansError || savingsError || finesError || transactionsError) {
      console.error('Error fetching member stats:', { loansError, savingsError, finesError, transactionsError })
      return null
    }

    // Compute aggregate totals
    const totalSavings = memberSavings?.reduce(
      (sum: number, s) => sum + s.balance,
      0
    ) || 0

    const activeLoans = memberLoans?.filter((l) => l.status === "active" || l.status === "disbursed") || []
    const outstandingBalance = activeLoans.reduce(
      (sum: number, l) => sum + l.balance,
      0
    )

    const pendingFines = memberFines?.filter((f) => f.status === "pending") || []
    const totalFines = pendingFines.reduce(
      (sum: number, f) => sum + f.amount,
      0
    )

    // Map snake_case DB columns to camelCase for the frontend
    const formattedLoans = memberLoans?.map(loan => ({
      id: loan.id,
      saccoId: loan.sacco_id,
      memberId: loan.member_id,
      categoryId: loan.category_id,
      loanRef: loan.loan_ref,
      amount: loan.amount,
      balance: loan.balance,
      interestRate: loan.interest_rate,
      status: loan.status,
      dueDate: loan.due_date ? new Date(loan.due_date) : null,
      disbursedAt: loan.disbursed_at ? new Date(loan.disbursed_at) : null,
      settledAt: loan.settled_at ? new Date(loan.settled_at) : null,
      declineReason: loan.decline_reason,
      notes: loan.notes,
      createdAt: new Date(loan.created_at),
      updatedAt: new Date(loan.updated_at),
      interestRateId: loan.interest_rate_id,
      expectedReceived: loan.expected_received,
      interestType: loan.interest_type,
      durationMonths: loan.duration_months,
      latePenaltyFee: loan.late_penalty_fee,
      dailyPayment: loan.daily_payment,
      monthlyPayment: loan.monthly_payment,
    })) || []

    const formattedSavings = memberSavings?.map(saving => ({
      id: saving.id,
      saccoId: saving.sacco_id,
      memberId: saving.member_id,
      categoryId: saving.category_id,
      accountNumber: saving.account_number,
      balance: saving.balance,
      accountType: saving.account_type,
      isLocked: saving.is_locked,
      lockUntil: saving.lock_until ? new Date(saving.lock_until) : null,
      lockReason: saving.lock_reason,
      createdAt: new Date(saving.created_at),
      updatedAt: new Date(saving.updated_at),
    })) || []

    const formattedFines = memberFines?.map(fine => ({
      id: fine.id,
      fine_ref: fine.fine_ref,
      amount: fine.amount,
      reason: fine.reason,
      description: fine.description,
      status: fine.status,
      priority: fine.priority,
      due_date: fine.due_date ? new Date(fine.due_date) : null,
      paid_at: fine.paid_at ? new Date(fine.paid_at) : null,
      payment_method: fine.payment_method,
      payment_reference: fine.payment_reference,
      waiver_reason: fine.waiver_reason,
      notes: fine.notes,
      created_at: new Date(fine.created_at),
      updated_at: new Date(fine.updated_at),
      member_id: fine.member_id,
      category_id: fine.category_id,
    })) || []

    const formattedTransactions = memberTransactions?.map(tx => ({
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

    return {
      loans: formattedLoans,
      savings: formattedSavings,
      fines: formattedFines,
      transactions: formattedTransactions,
      stats: {
        totalSavings,
        totalLoans: outstandingBalance,
        totalFines: totalFines,
        totalTransactions: formattedTransactions.length,
      },
    }
  } catch (err) {
    console.error(err)
    return null
  }
}

/**
 * Creates a new loan for a member directly from the member detail page.
 * Provides a quick way to assign a loan without going through the full loan creation flow.
 * Amount is expected in major currency units (converted to cents internally).
 */
export async function assignLoanAction(
  memberId: string,
  prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    // Convert UGX to cents for integer storage
    const amount = parseInt(formData.get("amount") as string) * 100
    const interest_rate = formData.get("interest_rate") as string
    const due_date = formData.get("due_date") as string
    const purpose = formData.get("purpose") as string

    if (!amount || amount <= 0) return { error: "Valid amount is required." }
    if (!due_date) return { error: "Due date is required." }

    // Fetch member to validate and get contact info
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', memberId)
      .eq('sacco_id', user.saccoId)
      .single()

    if (memberError || !member) {
      return { error: "Member not found." }
    }

    const loan_ref = `${LOAN_REF_PREFIX}-${Date.now()}`

    // Calculate expected repayment including interest
    const calc = calculateLoan({
      principal: amount,
      interestRate: parseFloat(interest_rate || "0"),
      interestType: "monthly",
      durationMonths: 12,
    })

    // Insert the loan with pending status
    const { error: insertError } = await supabaseAdmin
      .from('loans')
      .insert({
        sacco_id: user.saccoId,
        member_id: memberId,
        loan_ref,
        amount,
        expected_received: calc.totalExpectedReceived,
        balance: calc.totalExpectedReceived,
        interest_rate: interest_rate || "0",
        status: "pending",
        due_date,
        notes: purpose || null,
      })

    if (insertError) {
      console.error('Error creating loan:', insertError)
      return { error: "Failed to assign loan." }
    }

    // Notify the member — non-fatal
    if (member.phone) {
      try {
        await sendSmsOrQueue({
          to: member.phone,
          message: `Dear ${member.full_name}, your loan application of UGX ${(amount / 100).toLocaleString()} has been submitted. Ref: ${loan_ref}. Await approval. - SACCO`,
        })
      } catch (smsError) {
        console.error('SMS sending failed:', smsError)
      }
    }

    revalidatePath("/members")
    revalidatePath(`/members/${memberId}`)
    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to assign loan." }
  }
}

/**
 * Records a savings deposit for a member.
 * If the member has no existing savings account, one is auto-created.
 * Otherwise the deposit is added to their primary account balance.
 * Amount is expected in major currency units (converted to cents internally).
 */
export async function addSavingsAction(
  memberId: string,
  prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized." }

    // Convert UGX to cents
    const amount = parseInt(formData.get("amount") as string) * 100
    const narration = formData.get("narration") as string

    if (!amount || amount <= 0) return { error: "Valid amount is required." }

    // Fetch the member to validate existence and get contact info
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('phone, full_name, member_code')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return { error: "Member not found." }
    }

    // Check for existing savings accounts
    const { data: existingAccounts, error: accountsError } = await supabaseAdmin
      .from('savings_accounts')
      .select('*')
      .eq('member_id', memberId)
      .eq('sacco_id', user.saccoId)

    if (accountsError) {
      console.error('Error checking existing accounts:', accountsError)
      return { error: "Failed to check existing accounts." }
    }

    let newBalance: number

    if (!existingAccounts || existingAccounts.length === 0) {
      // No existing account — create one with the deposit as the opening balance
      const account_number = `${SAVINGS_ACCOUNT_PREFIX}-${Date.now()}`
      const { data: newAccount, error: insertError } = await supabaseAdmin
        .from('savings_accounts')
        .insert({
          sacco_id: user.saccoId,
          member_id: memberId,
          account_number,
          balance: amount,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating savings account:', insertError)
        return { error: "Failed to create savings account." }
      }

      newBalance = amount
    } else {
      // Add to existing primary account balance
      const account = existingAccounts[0]
      newBalance = account.balance + amount

      const { error: updateError } = await supabaseAdmin
        .from('savings_accounts')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id)

      if (updateError) {
        console.error('Error updating savings balance:', updateError)
        return { error: "Failed to update savings balance." }
      }
    }

    // Create a transaction record for the deposit
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        sacco_id: user.saccoId,
        member_id: memberId,
        type: "savings_deposit",
        amount,
        narration: narration || "Savings deposit",
        payment_method: "cash",
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return { error: "Failed to create transaction record." }
    }

    // Send deposit confirmation SMS — non-fatal
    if (member.phone) {
      try {
        const { data: saccoForSms } = await supabaseAdmin.from('saccos').select('settings').eq('id', user.saccoId).single()
        const saccoSettings = parseSaccoSettings(saccoForSms?.settings)
        const templates = getSmsTemplates(saccoSettings?.sms?.language)
        await sendSmsOrQueue({
          to: member.phone,
          message: templates.savingsDeposit(
            member.full_name,
            amount / 100,
            newBalance / 100,
            member.member_code
          ),
        })
      } catch (smsError) {
        console.error('SMS sending failed:', smsError)
      }
    }

    revalidatePath("/members")
    revalidatePath(`/members/${memberId}`)
    revalidatePath("/savings")
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to add savings." }
  }
}

/** Zod schema for validating individual imported rows. */
const importRowSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  phone: z.string().min(9, "Valid phone number required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  national_id: z.string().min(3, "National ID is required"),
  address: z.string().optional(),
})

/**
 * Bulk-imports members from an Excel upload.
 * Only admins can perform bulk imports.
 *
 * Each row is:
 *   1. Validated against the Zod schema
 *   2. Checked for duplicate phone / national_id against existing members
 *   3. Inserted individually so one bad row doesn't sink the whole batch
 *
 * Returns the count of successfully imported rows and any per-row errors.
 */
export async function importMembersAction(
  rows: Array<{
    full_name: string
    phone: string
    email: string
    national_id: string
    address: string
  }>
): Promise<MemberFormState & { imported?: number; errors?: string[] }> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized." }

    if (user.role !== "admin") {
      return { error: "You don't have permission to import members" }
    }

    // Pre-generate member codes for the entire batch
    const memberCodes = await generateMemberCodes(user.saccoId, rows.length)

    // Fetch existing phones and national IDs for duplicate detection
    const { data: existingMembers } = await supabaseAdmin
      .from('members')
      .select('phone, national_id')
      .eq('sacco_id', user.saccoId)

    const existingPhones = new Set(existingMembers?.map(m => m.phone).filter(Boolean) ?? [])
    const existingNationalIds = new Set(existingMembers?.map(m => m.national_id).filter(Boolean) ?? [])

    let imported = 0
    const rowErrors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowLabel = `Row ${i + 2}` // +2 for 1-indexed + header row

      // 1. Zod validation
      const parsed = importRowSchema.safeParse(row)
      if (!parsed.success) {
        rowErrors.push(`${rowLabel}: ${parsed.error.flatten().fieldErrors.full_name?.[0] ?? "Validation failed"}`)
        continue
      }

      // 2. Duplicate phone
      if (parsed.data.phone && existingPhones.has(parsed.data.phone)) {
        rowErrors.push(`${rowLabel}: Phone ${parsed.data.phone} already exists`)
        continue
      }

      // 3. Duplicate national ID
      if (parsed.data.national_id && existingNationalIds.has(parsed.data.national_id)) {
        rowErrors.push(`${rowLabel}: National ID ${parsed.data.national_id} already exists`)
        continue
      }

      // 4. Insert
      const { error: insertError } = await supabaseAdmin
        .from('members')
        .insert({
          sacco_id: user.saccoId,
          member_code: memberCodes[i],
          full_name: parsed.data.full_name,
          phone: parsed.data.phone || null,
          email: parsed.data.email || null,
          national_id: parsed.data.national_id || null,
          address: parsed.data.address || null,
          status: "active",
        })

      if (insertError) {
        rowErrors.push(`${rowLabel}: ${insertError.message}`)
        continue
      }

      // Add to sets so subsequent duplicate checks catch intra-batch dupes
      if (parsed.data.phone) existingPhones.add(parsed.data.phone)
      if (parsed.data.national_id) existingNationalIds.add(parsed.data.national_id)

      imported++
    }

    revalidatePath("/members")

    if (imported === 0) {
      return { error: `No members were imported.${rowErrors.length ? ` Issues: ${rowErrors.join("; ")}` : ""}` }
    }

    return {
      success: true,
      imported,
      errors: rowErrors.length > 0 ? rowErrors : undefined,
    }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to import members." }
  }
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED ACTIONS:
//   addMemberAction(prevState, formData)           – create a member + portal account + welcome SMS
//   editMemberAction(id, prevState, formData)      – update member profile (admin only)
//   deleteMemberAction(id)                         – soft-delete a member (checks active loans/savings/fines)
//   updateMemberStatusAction(id, status)           – change active/suspended/exited status
//   sendMemberSmsAction(id, message)               – send a custom SMS to a member
//   getMemberStatsAction(id)                       – fetch loans, savings, fines, transactions
//   assignLoanAction(memberId, prevState, formData)– quick-assign a loan from the member page
//   addSavingsAction(memberId, prevState, formData)– record a savings deposit
//   importMembersAction(rows)                      – bulk-import members from Excel
//
// EXPORTED TYPES:
//   MemberFormState  – { success?, error?, fieldErrors? }
//
// KEY CONSTANTS:
//   CENTS_PER_UNIT             = 100
//   PHOTO_MAX_SIZE_BYTES       = 5 242 880  (5 MB)
//   ALLOWED_PHOTO_TYPES        = ["image/jpeg", "image/png", "image/webp"]
//   MEMBER_MANAGEMENT_ROLES    = ["admin", "cashier", "field_agent", "branch_admin"]
//   RECENT_TRANSACTIONS_LIMIT  = 20
//   LOAN_REF_PREFIX            = "LN"
//   SAVINGS_ACCOUNT_PREFIX     = "SAV"
//
// KEY HELPERS:
//   parseSaccoSettings(raw)   – safely parse the SACCO settings JSON column
//
// RELATED FILES:
//   lib/auth.ts                   – getCurrentUser
//   lib/member-code.ts            – generateMemberCode / generateMemberCodes
//   lib/sms.ts                    – sendSms, getSmsTemplates
//   lib/credentials.ts            – generateEmail, generatePassword
//   lib/activity-log.ts           – logActivity (audit trail)
//   lib/supabase/storage.ts       – STORAGE_BUCKETS constant

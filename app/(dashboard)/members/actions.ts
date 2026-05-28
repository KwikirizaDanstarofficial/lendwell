"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { STORAGE_BUCKETS } from "@/lib/supabase/storage"
import { revalidatePath } from "next/cache"
import { generateMemberCode, generateMemberCodes } from "@/lib/member-code"
import { sendSms, getSmsTemplates } from "@/lib/sms"
import { getCurrentUser } from "@/lib/auth"
import { generateEmail, generatePassword } from "@/lib/credentials"
import { z } from "zod"
import { calculateLoan } from "@/lib/pdf/loan-calculator"

// ─── Schema ───────────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemberFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

// ─── Photo Upload Helper ───────────────────────────────────────────────────────

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

async function uploadMemberPhoto(
  photoFile: File,
  saccoId: string,
  memberCode: string
): Promise<string | null> {
  try {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(photoFile.type)) {
      throw new Error("Only JPG, PNG, and WEBP images are allowed")
    }

    if (photoFile.size > 5 * 1024 * 1024) {
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

// ─── Add Member ───────────────────────────────────────────────────────────────

export async function addMemberAction(
  prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    // Admin, cashier, branch_admin, and field agent can add members
    if (!["admin", "cashier", "field_agent", "branch_admin"].includes(user.role)) {
      console.log(
        `Permission denied: User ${user.email} (role: ${user.role}) attempted to add a member`
      )
      return { error: "You don't have permission to add members" }
    }

    const member_code = await generateMemberCode(user.saccoId)

    // Handle photo upload
    let photo_url = null
    const photoFile = formData.get("photo") as File | null
    if (photoFile && photoFile instanceof File && photoFile.size > 0) {
      photo_url = await uploadMemberPhoto(photoFile, user.saccoId, member_code)
    }

    const branchId = (formData.get("branch_id") as string) || null

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

    if (parsed.data.phone) {
      try {
        const { data: saccoForWelcome } = await supabaseAdmin.from('saccos').select('settings').eq('id', user.saccoId).single()
        const saccoSettings = (() => { try { return JSON.parse(saccoForWelcome?.settings ?? "{}") } catch { return {} } })()
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
        const welcomeMsg = getSmsTemplates(saccoSettings?.sms?.language).welcome(parsed.data.full_name, member_code)
        const credMsg = !authError
          ? `\nPortal login:\nEmail: ${memberEmail}\nPassword: ${memberPassword}\n${appUrl}`
          : ""
        sendSms({
          to: parsed.data.phone,
          message: welcomeMsg + credMsg,
        }).catch((err) => console.error("[Member] SMS error:", err))
      } catch (smsError) {
        console.error("[Member] SMS failed:", smsError)
      }
    }

    revalidatePath("/members")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add member. Please try again." }
  }
}

// ─── Edit Member ──────────────────────────────────────────────────────────────

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

    // Only admin can edit members
    if (user.role !== "admin") {
      return { error: "You don't have permission to edit members" }
    }

    

    // Get existing member to check current photo
    const { data: existingMember, error: memberError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (memberError || !existingMember) {
      return { error: "Member not found" }
    }

    // Handle photo upload
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

    if (parsed.data.phone && parsed.data.phone !== existingMember.phone) {
      try {
        await sendSms({
          to: parsed.data.phone,
          message: `Dear ${parsed.data.full_name}, your SACCO profile has been updated. Member code: ${existingMember.member_code}. - SACCO`,
        })
      } catch (smsError) {
        console.error('SMS sending failed:', smsError)
        // Don't fail the update if SMS fails
      }
    }

    revalidatePath("/members")
    revalidatePath(`/members/${id}`)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to update member. Please try again." }
  }
}

// ─── Delete Member ────────────────────────────────────────────────────────────

export async function deleteMemberAction(id: string): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    // Only admin can delete members
    if (user.role !== "admin") {
      return { error: "You don't have permission to delete members" }
    }

    

    // Check if member exists
    const { data: existing, error: memberError } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('id', id)
      .single()

    if (memberError || !existing) {
      return { error: "Member not found." }
    }

    // Check loans, savings, and fines in parallel
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

    // Fetch member name for the log
    const { data: memberData } = await supabaseAdmin
      .from('members').select('full_name, member_code').eq('id', id).single()

    // Soft-delete the member
    const { error: deleteError } = await supabaseAdmin
      .from('members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting member:', deleteError)
      return { error: "Failed to delete member." }
    }

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
    return { error: "Failed to delete member." }
  }
}

// ─── Update Member Status ─────────────────────────────────────────────────────

export async function updateMemberStatusAction(
  id: string,
  status: "active" | "suspended" | "exited"
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    // Only admin can update member status
    if (user.role !== "admin") {
      return { error: "You don't have permission to update member status" }
    }

    

    // Get the member
    const { data: existing, error: memberError } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', id)
      .single()

    if (memberError || !existing) {
      return { error: "Member not found." }
    }

    // Update member status
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

    if (existing.phone) {
      const messages = {
        active: `Dear ${existing.full_name}, your SACCO membership has been activated. Welcome back! - SACCO`,
        suspended: `Dear ${existing.full_name}, your SACCO membership has been suspended. Contact us for more info. - SACCO`,
        exited: `Dear ${existing.full_name}, your SACCO membership has been closed. Thank you for being with us. - SACCO`,
      }
      try {
        await sendSms({
          to: existing.phone,
          message: messages[status],
        })
      } catch (smsError) {
        console.error('SMS sending failed:', smsError)
        // Don't fail the status update if SMS fails
      }
    }

    revalidatePath("/members")
    revalidatePath(`/members/${id}`)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to update member status." }
  }
}

// ─── Send SMS to Member ───────────────────────────────────────────────────────

export async function sendMemberSmsAction(
  id: string,
  message: string
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    // Only admin and cashier can send SMS to members
    if (!["admin", "cashier"].includes(user.role)) {
      return { error: "You don't have permission to send SMS to members" }
    }

    

    // Get the member
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

    try {
      await sendSms({ to: member.phone, message })
    } catch (smsError) {
      console.error('SMS sending failed:', smsError)
      return { error: "Failed to send SMS." }
    }

    // Create notification record
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
      // Continue anyway as SMS was sent
    }

    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to send SMS." }
  }
}

// ─── Get Member Stats ─────────────────────────────────────────────────────────

export async function getMemberStatsAction(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    

    const [
      { data: memberLoans, error: loansError },
      { data: memberSavings, error: savingsError },
      { data: memberFines, error: finesError },
      { data: memberTransactions, error: transactionsError },
    ] = await Promise.all([
      supabaseAdmin
        .from('loans')
        .select('id, sacco_id, member_id, category_id, loan_ref, amount, balance, interest_rate, status, due_date, disbursed_at, settled_at, decline_reason, notes, created_at, updated_at, interest_rate_id, expected_received, interest_type, duration_months, late_penalty_fee, daily_payment, monthly_payment')
        .eq('member_id', id)
        .eq('sacco_id', user.saccoId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('savings_accounts')
        .select('id, sacco_id, member_id, category_id, account_number, balance, account_type, is_locked, lock_until, lock_reason, created_at, updated_at')
        .eq('member_id', id)
        .eq('sacco_id', user.saccoId),
      supabaseAdmin
        .from('fines')
        .select('id, fine_ref, amount, reason, description, status, priority, due_date, paid_at, payment_method, payment_reference, waiver_reason, notes, created_at, updated_at, member_id, category_id')
        .eq('member_id', id)
        .eq('sacco_id', user.saccoId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('transactions')
        .select('id, sacco_id, member_id, type, amount, balance_after, reference_id, payment_method, narration, created_at')
        .eq('member_id', id)
        .eq('sacco_id', user.saccoId)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    if (loansError) {
      console.error('Error fetching member loans:', loansError)
      return null
    }
    if (savingsError) {
      console.error('Error fetching member savings:', savingsError)
      return null
    }
    if (finesError) {
      console.error('Error fetching member fines:', finesError)
      return null
    }
    if (transactionsError) {
      console.error('Error fetching member transactions:', transactionsError)
      return null
    }

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

    // Format the data to match the expected interface
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

// ─── Assign Loan to Member ────────────────────────────────────────────────────

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

    const amount = parseInt(formData.get("amount") as string) * 100
    const interest_rate = formData.get("interest_rate") as string
    const due_date = formData.get("due_date") as string
    const purpose = formData.get("purpose") as string

    if (!amount || amount <= 0) return { error: "Valid amount is required." }
    if (!due_date) return { error: "Due date is required." }

    

    // Get the member
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('phone, full_name')
      .eq('id', memberId)
      .eq('sacco_id', user.saccoId)
      .single()

    if (memberError || !member) {
      return { error: "Member not found." }
    }

    const loan_ref = `LN-${Date.now()}`

    // Calculate loan details
    const calc = calculateLoan({
      principal: amount,
      interestRate: parseFloat(interest_rate || "0"),
      interestType: "monthly",
      durationMonths: 12,
    })

    // Create loan
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

    if (member.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, your loan application of UGX ${(amount / 100).toLocaleString()} has been submitted. Ref: ${loan_ref}. Await approval. - SACCO`,
        })
      } catch (smsError) {
        console.error('SMS sending failed:', smsError)
        // Don't fail the loan creation if SMS fails
      }
    }

    revalidatePath("/members")
    revalidatePath(`/members/${memberId}`)
    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to assign loan." }
  }
}

// ─── Add Savings to Member ────────────────────────────────────────────────────

export async function addSavingsAction(
  memberId: string,
  prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized." }

    const amount = parseInt(formData.get("amount") as string) * 100
    const narration = formData.get("narration") as string

    if (!amount || amount <= 0) return { error: "Valid amount is required." }

    

    // Get the member
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

    let accountId: string
    let newBalance: number

    if (!existingAccounts || existingAccounts.length === 0) {
      // Create new savings account
      const account_number = `SAV-${Date.now()}`
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

      accountId = newAccount.id
      newBalance = amount
    } else {
      // Update existing account balance
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

      accountId = account.id
    }

    // Create transaction record
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

    if (member.phone) {
      try {
        const { data: saccoForSms } = await supabaseAdmin.from('saccos').select('settings').eq('id', user.saccoId).single()
        const saccoSettings = (() => { try { return JSON.parse(saccoForSms?.settings ?? "{}") } catch { return {} } })()
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
        console.error('SMS sending failed:', smsError)
      }
    }

    revalidatePath("/members")
    revalidatePath(`/members/${memberId}`)
    revalidatePath("/savings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add savings." }
  }
}

// ─── Import Members from Excel ────────────────────────────────────────────────

export async function importMembersAction(
  rows: Array<{
    full_name: string
    phone: string
    email: string
    national_id: string
    address: string
  }>
): Promise<MemberFormState & { imported?: number }> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized." }

    // Only admin can import members
    if (user.role !== "admin") {
      return { error: "You don't have permission to import members" }
    }

    

    const memberCodes = await generateMemberCodes(user.saccoId, rows.length)
    const members = rows.map((row, i) => ({
      sacco_id: user.saccoId,
      member_code: memberCodes[i],
      full_name: row.full_name,
      phone: row.phone || null,
      email: row.email || null,
      national_id: row.national_id || null,
      address: row.address || null,
      status: "active",
    }))

    const { error: insertError } = await supabaseAdmin.from('members').insert(members)

    if (insertError) {
      console.error('Error importing members:', insertError)
      return { error: "Failed to import members." }
    }

    const imported = members.length

    revalidatePath("/members")
    return { success: true, imported }
  } catch (err) {
    console.error(err)
    return { error: "Failed to import members." }
  }
}

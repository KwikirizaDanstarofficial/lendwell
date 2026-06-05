"use server"
import { isOfflineError } from "@/lib/offline-safe"

import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendSmsOrQueue, sendSms } from "@/lib/sms"
import { z } from "zod"

export type ComplaintFormState = {
  offline?: boolean
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const complaintSchema = z.object({
  member_id: z
    .string()
    .uuid("Please select a member")
    .optional()
    .or(z.literal("")),
  subject: z.string().min(3, "Subject is required"),
  body: z.string().min(10, "Please describe the complaint in detail"),
  category: z.string().default("general"),
  priority: z.string().default("normal"),
  notes: z.string().optional(),
})

// ─── Add Complaint ─────────────────────────────────────────────────────────────

export async function addComplaintAction(
  prevState: ComplaintFormState,
  formData: FormData
): Promise<ComplaintFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    

    const raw = {
      member_id: formData.get("member_id") as string,
      subject: formData.get("subject") as string,
      body: formData.get("body") as string,
      category: (formData.get("category") as string) || "general",
      priority: (formData.get("priority") as string) || "normal",
      notes: formData.get("notes") as string,
    }

    const parsed = complaintSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const complaint_ref = `CMP-${Date.now()}`

    // Insert complaint using Supabase
    const { error: insertError } = await supabaseAdmin
      .from('complaints')
      .insert({
        sacco_id: user.saccoId,
        member_id: parsed.data.member_id || null,
        complaint_ref,
        subject: parsed.data.subject,
        body: parsed.data.body,
        category: parsed.data.category,
        priority: parsed.data.priority,
        notes: parsed.data.notes || null,
        status: "open",
      })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return { error: "Failed to submit complaint." }
    }

    // Notify member if linked
    if (parsed.data.member_id) {
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('phone, full_name')
        .eq('id', parsed.data.member_id)
        .single()

      if (member?.phone) {
        try {
          await sendSmsOrQueue({
            to: member.phone,
            message: `Dear ${member.full_name}, your complaint (Ref: ${complaint_ref}) has been received and is being reviewed. We will respond shortly. - SACCO`,
          })
        } catch (smsError) {
          console.error('SMS sending failed:', smsError)
          // Don't fail the complaint creation if SMS fails
        }
      }
    }

    revalidatePath("/complaints")
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { offline: true, error: "offline" }
    return { error: (err as any)?.message || "Failed to submit complaint." }
  }
}

// ─── Update Complaint Status ───────────────────────────────────────────────────

export async function updateComplaintStatusAction(
  id: string,
  status: "open" | "in_progress" | "resolved",
  resolution_notes?: string
): Promise<ComplaintFormState> {
  try {
    

    // Get current complaint
    const { data: complaint, error: fetchError } = await supabaseAdmin
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !complaint) {
      return { error: "Complaint not found." }
    }

    // Update complaint
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (resolution_notes !== undefined) {
      updateData.resolution_notes = resolution_notes
    }

    if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString()
    }

    const { error: updateError } = await supabaseAdmin
      .from('complaints')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return { error: "Failed to update complaint status." }
    }

    // Notify member on resolution
    if (status === "resolved" && complaint.member_id) {
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('phone, full_name')
        .eq('id', complaint.member_id)
        .single()

      if (member?.phone) {
        try {
          await sendSmsOrQueue({
            to: member.phone,
            message: `Dear ${member.full_name}, your complaint (Ref: ${complaint.complaint_ref}) has been resolved. ${resolution_notes ? `Resolution: ${resolution_notes}` : ""} - SACCO`,
          })
        } catch (smsError) {
          console.error('SMS sending failed:', smsError)
          // Don't fail the status update if SMS fails
        }
      }
    }

    revalidatePath("/complaints")
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { offline: true, error: "offline" }
    return { error: (err as any)?.message || "Failed to update complaint status." }
  }
}

// ─── Resolve Complaint ─────────────────────────────────────────────────────────

export async function resolveComplaintAction(
  prevState: ComplaintFormState,
  formData: FormData
): Promise<ComplaintFormState> {
  const id = formData.get("id") as string
  const resolution_notes = formData.get("resolution_notes") as string

  if (!resolution_notes?.trim()) {
    return { error: "Resolution notes are required." }
  }

  return updateComplaintStatusAction(id, "resolved", resolution_notes)
}

// ─── Delete Complaint ──────────────────────────────────────────────────────────

export async function deleteComplaintAction(
  id: string
): Promise<ComplaintFormState> {
  try {
    

    const { error } = await supabaseAdmin
      .from('complaints')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      return { error: "Failed to delete complaint." }
    }

    revalidatePath("/complaints")
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { offline: true, error: "offline" }
    return { error: (err as any)?.message || "Failed to delete complaint." }
  }
}

// ─── Submit Rating ─────────────────────────────────────────────────────────────

export async function submitRatingAction(
  id: string,
  rating: number,
  feedback: string
): Promise<ComplaintFormState> {
  try {
    

    const { error } = await supabaseAdmin
      .from('complaints')
      .update({
        satisfaction_rating: rating,
        feedback,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Supabase update error:', error)
      return { error: "Failed to submit rating." }
    }

    revalidatePath("/complaints")
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { offline: true, error: "offline" }
    return { error: (err as any)?.message || "Failed to submit rating." }
  }
}

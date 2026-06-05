"use server"
import { isOfflineError } from "@/lib/offline-safe"

import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { enqueueSmsMany, processSmsBatch } from "@/lib/notification-queue"

export type NotificationFormState = {
  success?: boolean
  error?: string
  sent?: number
  queued?: number
}

export async function sendNotificationAction(
  prevState: NotificationFormState,
  formData: FormData
): Promise<NotificationFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    const target = formData.get("target") as string
    const memberId = formData.get("memberId") as string
    const title = formData.get("title") as string
    const body = formData.get("body") as string
    const channel = formData.get("channel") as string
    const priority = formData.get("priority") as string

    if (!title || !body) return { error: "Title and message are required." }

    // Fetch target members
    let targetMembers: { id: string; phone: string | null }[] = []

    if (target === "all") {
      const { data, error } = await supabaseAdmin
        .from("members")
        .select("id, phone")
        .eq("sacco_id", user.saccoId)
      if (error) return { error: "Failed to fetch members." }
      targetMembers = data || []
    } else if (target === "active") {
      const { data, error } = await supabaseAdmin
        .from("members")
        .select("id, phone")
        .eq("sacco_id", user.saccoId)
        .eq("status", "active")
      if (error) return { error: "Failed to fetch active members." }
      targetMembers = data || []
    } else if (target === "member" && memberId) {
      const { data, error } = await supabaseAdmin
        .from("members")
        .select("id, phone")
        .eq("id", memberId)
        .single()
      if (!error && data) targetMembers = [data]
    }

    if (targetMembers.length === 0) return { error: "No members to notify." }

    if (channel === "sms") {
      // Enqueue — the queue worker sends in batches of 50, with retries
      const withPhone = targetMembers.filter((m) => m.phone)
      const { count } = await enqueueSmsMany(
        withPhone.map((m) => ({
          saccoId: user.saccoId,
          memberId: m.id,
          phone: m.phone!,
          title,
          body,
          type: "sms",
          priority: priority || "normal",
        }))
      )
      // Process immediately — no minute-cron on Hobby plan
      let sent = 0
      let failed = 0
      while (true) {
        const result = await processSmsBatch()
        sent += result.sent
        failed += result.failed
        if (result.total < 50) break
      }

      revalidatePath("/notifications")
      return { success: true, queued: count, sent }
    }

    // In-app notifications: insert and mark sent immediately
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("notifications")
      .insert(
        targetMembers.map((member) => ({
          sacco_id: user.saccoId,
          member_id: member.id,
          title,
          body,
          type: "in_app",
          channel: "in_app",
          status: "sent",
          priority: priority || "normal",
          sent_at: new Date().toISOString(),
        }))
      )
      .select("id")

    if (insertError) return { error: "Failed to send notifications." }

    revalidatePath("/notifications")
    return { success: true, sent: inserted?.length ?? 0 }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to send notification." }
  }
}

export async function markNotificationReadAction(id: string) {
  try {
    

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error marking notification as read:', error)
      return { error: "Failed to mark as read." }
    }

    revalidatePath("/notifications")
    return { success: true }
  } catch (err) {
    console.error(err)
    if (isOfflineError(err)) return { error: "You\'re offline. Reconnect to perform this action." }
    return { error: (err as any)?.message || "Failed to mark as read." }
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting notification:', error)
      return { error: "Failed to delete." }
    }

    revalidatePath("/notifications")
    return { success: true }
  } catch {
    return { error: "Failed to delete." }
  }
}

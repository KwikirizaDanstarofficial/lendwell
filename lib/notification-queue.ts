import { supabaseAdmin } from "@/lib/supabase/server"
import { sendSms } from "@/lib/sms"

const BATCH_SIZE = 50

// Exponential backoff: 5 min after 1st failure, 30 min after 2nd
const RETRY_DELAYS_MS = [5 * 60 * 1000, 30 * 60 * 1000]

export interface SmsJob {
  saccoId: string
  memberId?: string | null
  phone: string
  title: string
  body: string
  type?: string
  priority?: string
  scheduledAt?: string
}

/**
 * Insert many SMS jobs into the notifications table as 'pending'.
 * Returns immediately — the queue worker handles actual delivery.
 */
export async function enqueueSmsMany(jobs: SmsJob[]): Promise<{ count: number }> {
  if (jobs.length === 0) return { count: 0 }

  const rows = jobs.map((job) => ({
    sacco_id: job.saccoId,
    member_id: job.memberId ?? null,
    title: job.title,
    body: job.body,
    type: "sms",
    channel: "sms",
    status: "pending",
    priority: job.priority ?? "normal",
    recipient_phone: job.phone,
    reference_type: job.type ?? "sms",
    scheduled_at: job.scheduledAt ?? new Date().toISOString(),
    max_retries: 3,
  }))

  // Insert in chunks of 500 to avoid Supabase payload limits
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500)
    const { error } = await supabaseAdmin.from("notifications").insert(chunk)
    if (error) throw new Error(`Failed to enqueue notifications: ${error.message}`)
  }

  return { count: jobs.length }
}

/**
 * Pick up to BATCH_SIZE pending SMS jobs, send them, and update their status.
 * Retries failed jobs up to max_retries times with exponential backoff.
 * Returns a summary of the batch.
 */
export async function processSmsBatch(): Promise<{
  sent: number
  failed: number
  retried: number
  total: number
}> {
  const now = new Date().toISOString()

  const { data: jobs, error } = await supabaseAdmin
    .from("notifications")
    .select("id, body, recipient_phone, retry_count, max_retries")
    .eq("status", "pending")
    .eq("channel", "sms")
    .not("recipient_phone", "is", null)
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_SIZE)

  if (error) throw new Error(`Queue read failed: ${error.message}`)
  if (!jobs?.length) return { sent: 0, failed: 0, retried: 0, total: 0 }

  // Fire all SMS in parallel
  const smsResults = await Promise.allSettled(
    jobs.map((job) =>
      sendSms({ to: job.recipient_phone!, message: job.body })
    )
  )

  let sent = 0
  let failed = 0
  let retried = 0

  // Write all status updates in parallel
  await Promise.allSettled(
    jobs.map(async (job, i) => {
      const result = smsResults[i]
      const success = result.status === "fulfilled" && result.value.success

      if (success) {
        sent++
        await supabaseAdmin
          .from("notifications")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", job.id)
        return
      }

      const errorMsg =
        result.status === "rejected"
          ? String(result.reason)
          : (result.value.error ?? "SMS delivery failed")

      const attempts = (job.retry_count ?? 0) + 1
      const maxRetries = job.max_retries ?? 3

      if (attempts >= maxRetries) {
        failed++
        await supabaseAdmin
          .from("notifications")
          .update({ status: "failed", retry_count: attempts, error_message: errorMsg })
          .eq("id", job.id)
      } else {
        // Keep as pending with backoff schedule
        const delayMs = RETRY_DELAYS_MS[attempts - 1] ?? RETRY_DELAYS_MS.at(-1)!
        const nextAt = new Date(Date.now() + delayMs).toISOString()
        retried++
        await supabaseAdmin
          .from("notifications")
          .update({
            retry_count: attempts,
            error_message: errorMsg,
            scheduled_at: nextAt,
          })
          .eq("id", job.id)
      }
    })
  )

  return { sent, failed, retried, total: jobs.length }
}

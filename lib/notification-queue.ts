/**
 * notification-queue.ts
 *
 * SMS notification queue for the SACCO application.
 *
 * Two-step workflow:
 *  1. enqueueSmsMany  — bulk-inserts SMS jobs into the `notifications` table
 *                       with status "pending". Returns immediately.
 *  2. processSmsBatch — consumer that picks up pending jobs, sends them via
 *                       sendSms(), and marks each row "sent" or "failed".
 *                       Retries with exponential back-off until max_retries.
 *
 * Designed to be called from a cron endpoint or serverless function.
 */

import { supabaseAdmin } from "@/lib/supabase/server"
import { sendSms } from "@/lib/sms"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum number of pending jobs processed per cron invocation. */
const BATCH_SIZE = 50

/** Maximum rows per Supabase insert request (payload size limit). */
const INSERT_CHUNK_SIZE = 500

/** Default number of send attempts before a job is marked "failed". */
const DEFAULT_MAX_RETRIES = 3

/** Default job priority when none is provided by the caller. */
const DEFAULT_PRIORITY = "normal"

/** Delay before each retry attempt (index 0 = after 1st failure, etc.). */
const RETRY_DELAY_MS: Record<number, number> = {
  0: 5 * 60 * 1000,   // 5 minutes after 1st failure
  1: 30 * 60 * 1000,  // 30 minutes after 2nd failure
}

/** Fallback retry delay when the attempt count exceeds RETRY_DELAY_MS entries. */
const RETRY_DELAY_FALLBACK_MS = 30 * 60 * 1000

// ─── Status / channel constants ───────────────────────────────────────────────

const STATUS_PENDING = "pending"
const STATUS_SENT    = "sent"
const STATUS_FAILED  = "failed"
const CHANNEL_SMS    = "sms"

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of a single SMS job passed to enqueueSmsMany. */
export interface SmsJob {
  /** SACCO organisation ID that owns this notification. */
  saccoId: string
  /** Member the message is addressed to (optional). */
  memberId?: string | null
  /** Recipient phone number (E.164 or local Uganda format). */
  phone: string
  /** Short title displayed in the notification list UI. */
  title: string
  /** Full SMS body text. */
  body: string
  /** Logical event type, e.g. "loan_approved". Stored as reference_type. */
  type?: string
  /** Delivery priority — "high" | "normal" | "low". Defaults to "normal". */
  priority?: string
  /** ISO timestamp for when to send (defaults to now). */
  scheduledAt?: string
}

// ─── Queue writer ─────────────────────────────────────────────────────────────

/**
 * Bulk-insert SMS jobs into the `notifications` table as "pending".
 *
 * Rows are batched in chunks of INSERT_CHUNK_SIZE to stay within Supabase
 * payload limits. Returns as soon as all rows are inserted — the queue worker
 * (processSmsBatch) handles actual delivery asynchronously.
 *
 * @param jobs - List of SMS jobs to enqueue.
 * @returns Total number of jobs successfully enqueued.
 * @throws If any insert chunk fails.
 */
export async function enqueueSmsMany(jobs: SmsJob[]): Promise<{ count: number }> {
  if (jobs.length === 0) return { count: 0 }

  const rows = jobs.map((job) => ({
    sacco_id:        job.saccoId,
    member_id:       job.memberId ?? null,
    title:           job.title,
    body:            job.body,
    type:            CHANNEL_SMS,
    channel:         CHANNEL_SMS,
    status:          STATUS_PENDING,
    priority:        job.priority ?? DEFAULT_PRIORITY,
    recipient_phone: job.phone,
    reference_type:  job.type ?? CHANNEL_SMS,
    scheduled_at:    job.scheduledAt ?? new Date().toISOString(),
    max_retries:     DEFAULT_MAX_RETRIES,
  }))

  for (let offset = 0; offset < rows.length; offset += INSERT_CHUNK_SIZE) {
    const chunk = rows.slice(offset, offset + INSERT_CHUNK_SIZE)
    const { error } = await supabaseAdmin.from("notifications").insert(chunk)
    if (error) throw new Error(`Failed to enqueue notifications: ${error.message}`)
  }

  return { count: jobs.length }
}

// ─── Queue consumer ───────────────────────────────────────────────────────────

/** Summary returned after each batch run. */
export interface BatchResult {
  /** Jobs delivered successfully this run. */
  sent: number
  /** Jobs permanently failed (exhausted max_retries). */
  failed: number
  /** Jobs rescheduled for a future retry attempt. */
  retried: number
  /** Total jobs picked up this run. */
  total: number
}

/**
 * Process up to BATCH_SIZE pending SMS jobs.
 *
 * - Fetches jobs whose scheduled_at is in the past.
 * - Fires all sends in parallel via Promise.allSettled.
 * - On success:  marks the job "sent".
 * - On failure:  increments retry_count and reschedules with exponential
 *                back-off, or marks "failed" once max_retries is reached.
 *
 * @returns A BatchResult summary of this run.
 * @throws If the initial queue read fails.
 */
export async function processSmsBatch(): Promise<BatchResult> {
  const nowIso = new Date().toISOString()

  // Fetch the next batch of jobs that are due
  const { data: pendingJobs, error: fetchError } = await supabaseAdmin
    .from("notifications")
    .select("id, body, recipient_phone, retry_count, max_retries")
    .eq("status",  STATUS_PENDING)
    .eq("channel", CHANNEL_SMS)
    .not("recipient_phone", "is", null)
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_SIZE)

  if (fetchError) throw new Error(`Queue read failed: ${fetchError.message}`)
  if (!pendingJobs?.length) return { sent: 0, failed: 0, retried: 0, total: 0 }

  // Fire all SMS sends in parallel
  const sendResults = await Promise.allSettled(
    pendingJobs.map((job) =>
      sendSms({ to: job.recipient_phone!, message: job.body })
    )
  )

  let sent    = 0
  let failed  = 0
  let retried = 0

  // Update each job's status based on its send result
  await Promise.allSettled(
    pendingJobs.map(async (job, index) => {
      const sendResult = sendResults[index]
      const wasDelivered =
        sendResult.status === "fulfilled" && sendResult.value.success

      if (wasDelivered) {
        sent++
        await supabaseAdmin
          .from("notifications")
          .update({ status: STATUS_SENT, sent_at: new Date().toISOString() })
          .eq("id", job.id)
        return
      }

      // Determine failure reason for error_message column
      const errorMessage =
        sendResult.status === "rejected"
          ? String(sendResult.reason)
          : (sendResult.value.error ?? "SMS delivery failed")

      const totalAttempts = (job.retry_count ?? 0) + 1
      const maxAttempts   = job.max_retries ?? DEFAULT_MAX_RETRIES

      if (totalAttempts >= maxAttempts) {
        // Exhausted retries — mark permanently failed
        failed++
        await supabaseAdmin
          .from("notifications")
          .update({
            status:        STATUS_FAILED,
            retry_count:   totalAttempts,
            error_message: errorMessage,
          })
          .eq("id", job.id)
      } else {
        // Reschedule with exponential back-off
        const delayMs   = RETRY_DELAY_MS[totalAttempts - 1] ?? RETRY_DELAY_FALLBACK_MS
        const nextRunAt = new Date(Date.now() + delayMs).toISOString()
        retried++
        await supabaseAdmin
          .from("notifications")
          .update({
            retry_count:   totalAttempts,
            error_message: errorMessage,
            scheduled_at:  nextRunAt,
          })
          .eq("id", job.id)
      }
    })
  )

  return { sent, failed, retried, total: pendingJobs.length }
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED FUNCTIONS:
//   enqueueSmsMany(jobs)   – bulk-insert SMS jobs as "pending" rows
//   processSmsBatch()      – pick up pending jobs and send them via EGO SMS
//
// EXPORTED TYPES:
//   SmsJob      – input shape for enqueueSmsMany
//   BatchResult – output shape of processSmsBatch
//
// KEY CONSTANTS:
//   BATCH_SIZE              = 50    (jobs per processSmsBatch run)
//   INSERT_CHUNK_SIZE       = 500   (rows per Supabase insert)
//   DEFAULT_MAX_RETRIES     = 3
//   RETRY_DELAY_MS          = { 0: 5 min, 1: 30 min }
//   RETRY_DELAY_FALLBACK_MS = 30 min
//
// DATABASE TABLE:
//   notifications — columns: id, sacco_id, member_id, title, body, type,
//                            channel, status, priority, recipient_phone,
//                            reference_type, scheduled_at, sent_at,
//                            retry_count, max_retries, error_message
//
// RELATED FILES:
//   lib/sms.ts              – sendSms() delivery function (EGO SMS gateway)
//   lib/sms-templates.ts    – message template factory for each language
//   api/queue/process       – HTTP endpoint that calls processSmsBatch()
//   api/cron/loan-reminders – cron endpoint that calls enqueueSmsMany()

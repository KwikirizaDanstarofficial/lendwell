import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sendSms } from "@/lib/sms"
import { getPendingQueue, markSent, markFailed, getQueueSize } from "@/lib/sms-queue-store"

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const queue = getPendingQueue()
  if (queue.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, remaining: 0 })
  }

  let sent = 0
  let failed = 0

  for (const sms of queue) {
    try {
      const result = await sendSms({ to: sms.to, message: sms.message })
      if (result.success) {
        markSent(sms.id)
        sent++
        console.log(`[SMS Queue] Sent to ${sms.to} (queued at ${new Date(sms.queuedAt).toISOString()})`)
      } else {
        markFailed(sms.id)
        failed++
        console.error(`[SMS Queue] Failed to send to ${sms.to}:`, result.error)
      }
    } catch (err) {
      markFailed(sms.id)
      failed++
      console.error(`[SMS Queue] Exception sending to ${sms.to}:`, err)
    }
  }

  return NextResponse.json({ sent, failed, remaining: getQueueSize() })
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ pending: getQueueSize() })
}

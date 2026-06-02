import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { enqueueSms, getQueueSize } from "@/lib/sms-queue-store"

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { to, message, context } = await req.json()
    if (!to || !message) {
      return NextResponse.json({ error: "to and message are required" }, { status: 400 })
    }

    enqueueSms({ to, message, context, saccoId: user.saccoId })
    return NextResponse.json({ success: true, pending: getQueueSize() })
  } catch (err) {
    console.error("[SMS Queue API]", err)
    return NextResponse.json({ error: "Failed to queue SMS" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { processSmsBatch } from "@/lib/notification-queue"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await processSmsBatch()
    console.log(`[QUEUE] batch processed: ${JSON.stringify(result)}`)
    return NextResponse.json(result)
  } catch (err) {
    console.error("[QUEUE] processSmsBatch error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}

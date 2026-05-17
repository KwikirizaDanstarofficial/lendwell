import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getLatestNotifications } from "@/db/queries/notifications"

export async function GET() {
  try {
    const user = await requireAuth()
    const notifications = await getLatestNotifications(user.saccoId, 8)
    return NextResponse.json(notifications)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

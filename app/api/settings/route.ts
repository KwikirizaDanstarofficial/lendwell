import { requireAuth } from "@/lib/auth"
import { getSaccoSettings } from "@/db/queries/settings"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const user = await requireAuth()

    const sacco = await getSaccoSettings(user.saccoId)

    return NextResponse.json(sacco)
  } catch (error) {
    console.error("Settings API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

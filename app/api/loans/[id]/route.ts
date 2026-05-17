import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getLoanById } from "@/db/queries/loans"
import { getAllMembers } from "@/db/queries/members"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const loan = await getLoanById(id, user.saccoId)

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    // Enrich with member data
    const members = await getAllMembers(user.saccoId)
    const member = members.find((m) => m.id === loan.memberId)

    const loanWithMember = {
      ...loan,
      member_name: member?.fullName || "Unknown",
      member_code: member?.memberCode || "N/A",
      member_phone: member?.phone,
      member_email: member?.email,
      member_national_id: member?.nationalId,
      member_address: member?.address,
    }

    return NextResponse.json(loanWithMember)
  } catch (error) {
    console.error("Error fetching loan:", error)
    return NextResponse.json({ error: "Failed to fetch loan" }, { status: 500 })
  }
}

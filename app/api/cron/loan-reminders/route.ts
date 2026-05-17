import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { enqueueSmsMany } from "@/lib/notification-queue"
import { smsTemplates } from "@/lib/sms"

export const runtime = "nodejs"
export const maxDuration = 30

function dateStr(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split("T")[0]
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = dateStr(0)
  const in1Day = dateStr(1)
  const in3Days = dateStr(3)

  // Single query — all loans that need a reminder today
  const { data: loans, error } = await supabaseAdmin
    .from("loans")
    .select(`
      id, loan_ref, balance, due_date, sacco_id, member_id,
      members:member_id ( full_name, phone, member_code )
    `)
    .in("status", ["active", "disbursed"])
    .not("due_date", "is", null)
    .or(
      `due_date.eq.${in3Days},due_date.eq.${in1Day},due_date.eq.${today},due_date.lt.${today}`
    )

  if (error) {
    console.error("[CRON:loan-reminders] DB error:", error)
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 })
  }

  const jobs = []

  for (const loan of loans ?? []) {
    const member = (loan as any).members
    if (!member?.phone) continue

    const balance = Number(loan.balance).toLocaleString()
    const dueDate = loan.due_date as string
    let body: string
    let priority: string

    if (dueDate === in3Days) {
      body = smsTemplates.loanReminder3Days(member.full_name, loan.loan_ref, balance, dueDate)
      priority = "normal"
    } else if (dueDate === in1Day) {
      body = smsTemplates.loanReminder1Day(member.full_name, loan.loan_ref, balance, dueDate)
      priority = "normal"
    } else if (dueDate === today) {
      body = smsTemplates.loanReminderToday(member.full_name, loan.loan_ref, balance)
      priority = "high"
    } else {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      body = smsTemplates.loanOverdue(member.full_name, loan.loan_ref, balance, daysOverdue)
      priority = "high"
    }

    jobs.push({
      saccoId: loan.sacco_id,
      memberId: loan.member_id,
      phone: member.phone,
      title: "Loan Reminder",
      body,
      type: "loan_reminder",
      priority,
    })
  }

  if (jobs.length === 0) {
    return NextResponse.json({ queued: 0 })
  }

  const { count } = await enqueueSmsMany(jobs)
  console.log(`[CRON:loan-reminders] queued ${count} reminders`)
  return NextResponse.json({ queued: count })
}

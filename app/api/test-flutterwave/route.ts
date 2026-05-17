import { NextResponse } from "next/server"
import { testFlutterwaveTransfer } from "@/lib/payments/test-flutterwave"

export async function GET() {
  const result = await testFlutterwaveTransfer()
  return NextResponse.json(result)
}

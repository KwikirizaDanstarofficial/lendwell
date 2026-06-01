"use client"
import dynamic from "next/dynamic"
export const LoanDetailPage = dynamic(
  () => import("./loan-detail-client").then((m) => ({ default: m.LoanDetailClient })),
  { ssr: false }
)

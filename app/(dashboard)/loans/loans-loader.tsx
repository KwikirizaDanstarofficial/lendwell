"use client"
import dynamic from "next/dynamic"
export const LoansClient = dynamic(
  () => import("./components/loans-client").then((m) => ({ default: m.LoansClient })),
  { ssr: false }
)

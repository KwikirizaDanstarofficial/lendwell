"use client"
import dynamic from "next/dynamic"
export const BankingClient = dynamic(
  () => import("./components/banking-client").then((m) => ({ default: m.BankingClient })),
  { ssr: false }
)

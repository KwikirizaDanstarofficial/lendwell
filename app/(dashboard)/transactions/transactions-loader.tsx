"use client"
import dynamic from "next/dynamic"
export const TransactionsClient = dynamic(
  () => import("./components/transactions-client").then((m) => ({ default: m.TransactionsClient })),
  { ssr: false }
)

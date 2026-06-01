"use client"
import dynamic from "next/dynamic"
export const SavingsClient = dynamic(
  () => import("./components/savings-client").then((m) => ({ default: m.SavingsClient })),
  { ssr: false }
)

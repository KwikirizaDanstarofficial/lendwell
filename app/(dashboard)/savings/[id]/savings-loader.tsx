"use client"
import dynamic from "next/dynamic"
export const SavingsDetailPageClient = dynamic(
  () => import("./savings-page-client").then((m) => ({ default: m.SavingsPageClient })),
  { ssr: false }
)

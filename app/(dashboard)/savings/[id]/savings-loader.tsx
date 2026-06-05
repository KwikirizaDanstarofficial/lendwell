"use client"
import dynamic from "next/dynamic"
import type { ComponentType } from "react"

type SavingsPageClientProps = { id: string; initialAccount?: any; initialTransactions?: any[] }

export const SavingsDetailPageClient = dynamic(
  () => import("./savings-page-client").then((m) => ({ default: m.SavingsPageClient })),
  { ssr: false }
) as unknown as ComponentType<SavingsPageClientProps>

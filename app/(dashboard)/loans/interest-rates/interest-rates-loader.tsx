"use client"
import dynamic from "next/dynamic"
export const InterestRatesClient = dynamic(
  () => import("./interest-rates-client").then((m) => ({ default: m.InterestRatesClient })),
  { ssr: false }
)

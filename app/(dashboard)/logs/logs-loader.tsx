"use client"
import dynamic from "next/dynamic"
export const LogsClient = dynamic(
  () => import("./logs-client").then((m) => ({ default: m.LogsClient })),
  { ssr: false }
)

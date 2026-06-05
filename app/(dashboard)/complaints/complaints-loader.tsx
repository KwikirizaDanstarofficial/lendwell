"use client"
import dynamic from "next/dynamic"
export const ComplaintsClient = dynamic(
  () => import("./components/complaints-client").then((m) => ({ default: m.ComplaintsClient })),
  { ssr: false }
)

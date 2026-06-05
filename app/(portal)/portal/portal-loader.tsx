"use client"
import dynamic from "next/dynamic"
export const PortalPageClient = dynamic(
  () => import("./portal-client").then((m) => ({ default: m.PortalClient })),
  { ssr: false }
)

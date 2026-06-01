"use client"
import dynamic from "next/dynamic"
export const MemberPageClient = dynamic(
  () => import("./member-page-client").then((m) => ({ default: m.MemberPageClient })),
  { ssr: false }
)

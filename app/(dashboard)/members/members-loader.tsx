"use client"
import dynamic from "next/dynamic"
export const MembersClient = dynamic(
  () => import("./components/members-client").then((m) => ({ default: m.MembersClient })),
  { ssr: false }
)

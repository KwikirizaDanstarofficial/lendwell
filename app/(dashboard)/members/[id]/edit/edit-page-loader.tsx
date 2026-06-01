"use client"
import dynamic from "next/dynamic"
export const EditPageClient = dynamic(
  () => import("./edit-page-client").then((m) => ({ default: m.EditPageClient })),
  { ssr: false }
)

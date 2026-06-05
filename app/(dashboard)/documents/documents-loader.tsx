"use client"
import dynamic from "next/dynamic"
export const DocumentsClient = dynamic(
  () => import("./components/documents-client").then((m) => ({ default: m.DocumentsClient })),
  { ssr: false }
)

"use client"
import dynamic from "next/dynamic"
export const FinesClient = dynamic(
  () => import("./components/fines-client").then((m) => ({ default: m.FinesClient })),
  { ssr: false }
)

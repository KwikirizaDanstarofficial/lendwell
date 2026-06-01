"use client"
import dynamic from "next/dynamic"
export const RecycleBinClient = dynamic(
  () => import("./recycle-bin-client").then((m) => ({ default: m.RecycleBinClient })),
  { ssr: false }
)

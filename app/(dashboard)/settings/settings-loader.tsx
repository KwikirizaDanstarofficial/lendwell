"use client"
import dynamic from "next/dynamic"
export const SettingsClient = dynamic(
  () => import("./components/settings-client").then((m) => ({ default: m.SettingsClient })),
  { ssr: false }
)

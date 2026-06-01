"use client"
import dynamic from "next/dynamic"
export const DashboardClient = dynamic(
  () => import("./components/dashboard-client").then((m) => ({ default: m.DashboardClient })),
  { ssr: false }
)

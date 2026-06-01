"use client"
import dynamic from "next/dynamic"
export const NotificationsClient = dynamic(
  () => import("./components/notifications-client").then((m) => ({ default: m.NotificationsClient })),
  { ssr: false }
)

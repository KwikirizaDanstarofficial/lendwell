"use client"
import dynamic from "next/dynamic"
export const UsersClient = dynamic(
  () => import("./components/users-client").then((m) => ({ default: m.UsersClient })),
  { ssr: false }
)

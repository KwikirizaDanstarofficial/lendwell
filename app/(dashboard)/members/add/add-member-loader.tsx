"use client"
import dynamic from "next/dynamic"
export const AddMemberForm = dynamic(
  () => import("./add-member-form").then((m) => ({ default: m.AddMemberForm })),
  { ssr: false }
)

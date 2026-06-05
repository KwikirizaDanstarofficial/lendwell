"use client"
import dynamic from "next/dynamic"
import type { ComponentType } from "react"

type EditPageClientProps = { id: string; initialMember?: any }

export const EditPageClient = dynamic(
  () => import("./edit-page-client").then((m) => ({ default: m.EditPageClient })),
  { ssr: false }
) as unknown as ComponentType<EditPageClientProps>

"use client"
import dynamic from "next/dynamic"
import type { ComponentType } from "react"

type RecycleBinProps = { saccoId?: string; isAdmin: boolean; members?: any[]; loans?: any[]; fines?: any[] }

export const RecycleBinClient = dynamic(
  () => import("./recycle-bin-client").then((m) => ({ default: m.RecycleBinClient })),
  { ssr: false }
) as unknown as ComponentType<RecycleBinProps>

"use client"
import dynamic from "next/dynamic"
export const AnalysisClient = dynamic(
  () => import("./components/analysis-client").then((m) => ({ default: m.AnalysisClient })),
  { ssr: false }
)

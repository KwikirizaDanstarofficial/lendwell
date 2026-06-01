"use client"
import dynamic from "next/dynamic"
export const NewLoanForm = dynamic(
  () => import("./new-loan-form").then((m) => ({ default: m.NewLoanForm })),
  { ssr: false }
)

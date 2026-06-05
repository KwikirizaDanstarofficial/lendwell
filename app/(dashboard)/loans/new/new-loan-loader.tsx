"use client"
import dynamic from "next/dynamic"
import type { ComponentType } from "react"

type NewLoanFormProps = { saccoId: string; members?: any[]; interestRates?: any[] }

export const NewLoanForm = dynamic(
  () => import("./new-loan-form").then((m) => ({ default: m.NewLoanForm })),
  { ssr: false }
) as unknown as ComponentType<NewLoanFormProps>

"use client"
import dynamic from "next/dynamic"
export const ExpensesClient = dynamic(
  () => import("./components/expenses-client").then((m) => ({ default: m.ExpensesClient })),
  { ssr: false }
)

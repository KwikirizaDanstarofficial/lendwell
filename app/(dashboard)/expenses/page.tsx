export const revalidate = 0

import { requireAuth } from "@/lib/auth"
import { ExpensesClient } from "./expenses-loader"

export default async function ExpensesPage() {
  const user = await requireAuth()
  return <ExpensesClient saccoId={user.saccoId} />
}

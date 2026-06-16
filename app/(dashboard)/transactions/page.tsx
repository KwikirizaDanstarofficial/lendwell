export const revalidate = 0

import { requireAuth } from "@/lib/auth"
import { TransactionsClient } from "./transactions-loader"

export default async function TransactionsPage() {
  const user = await requireAuth()
  return <TransactionsClient saccoId={user.saccoId} />
}

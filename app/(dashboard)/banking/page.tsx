export const revalidate = 0

import { requireAuth } from "@/lib/auth"
import { BankingClient } from "./banking-loader"

export default async function BankingPage() {
  const user = await requireAuth()
  return <BankingClient saccoId={user.saccoId} />
}

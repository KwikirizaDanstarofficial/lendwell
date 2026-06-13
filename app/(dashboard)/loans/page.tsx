import { requireAuth } from "@/lib/auth"
import { LoansClient } from "./loans-loader"

export default async function LoansPage() {
  const user = await requireAuth()
  return <LoansClient saccoId={user.saccoId} />
}

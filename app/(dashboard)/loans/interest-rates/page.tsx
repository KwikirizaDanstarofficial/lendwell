import { requireAuth } from "@/lib/auth"
import { InterestRatesClient } from "./interest-rates-loader"

export default async function InterestRatesPage() {
  const user = await requireAuth()
  return <InterestRatesClient saccoId={user.saccoId} />
}

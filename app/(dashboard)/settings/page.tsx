import {
  getSaccoSettings,
  getInterestRates,
  getLoanCategories,
  getSavingsCategories,
  getFineCategories,
} from "@/db/queries/settings"
import { requireAuth } from "@/lib/auth"
import { SettingsClient } from "./components/settings-client"

export default async function SettingsPage() {
  const user = await requireAuth()

  const [
    sacco,
    interestRates,
    loanCategories,
    savingsCategories,
    fineCategories,
  ] = await Promise.all([
    getSaccoSettings(user.saccoId),
    getInterestRates(user.saccoId),
    getLoanCategories(user.saccoId),
    getSavingsCategories(user.saccoId),
    getFineCategories(user.saccoId),
  ])

  return (
    <SettingsClient
      sacco={sacco}
      interestRates={interestRates}
      loanCategories={loanCategories}
      savingsCategories={savingsCategories}
      fineCategories={fineCategories}
    />
  )
}

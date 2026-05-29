import {
  getInterestRates,
  getLoanCategories,
  getSavingsCategories,
  getFineCategories,
} from "@/db/queries/settings"
import { requireAuth } from "@/lib/auth"
import { ProductsClient } from "./components/products-client"

export const metadata = { title: "Products — Lendwell" }

export default async function ProductsPage() {
  const user = await requireAuth()

  const [interestRates, loanCategories, savingsCategories, fineCategories] =
    await Promise.all([
      getInterestRates(user.saccoId),
      getLoanCategories(user.saccoId),
      getSavingsCategories(user.saccoId),
      getFineCategories(user.saccoId),
    ])

  return (
    <ProductsClient
      interestRates={interestRates}
      loanCategories={loanCategories}
      savingsCategories={savingsCategories}
      fineCategories={fineCategories}
    />
  )
}

export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { ProductsClient } from "./products-loader"

export const metadata = { title: "Products — Lendwell" }

export default async function ProductsPage() {
  const user = await requireAuth()
  return <ProductsClient saccoId={user.saccoId} />
}

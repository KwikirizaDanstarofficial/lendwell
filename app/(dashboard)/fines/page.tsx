export const revalidate = 0

import { requireAuth } from "@/lib/auth"
import { FinesClient } from "./fines-loader"

export default async function FinesPage() {
  const user = await requireAuth()
  return <FinesClient saccoId={user.saccoId} />
}

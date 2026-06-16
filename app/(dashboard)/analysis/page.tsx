export const revalidate = 0

import { requireAuth } from "@/lib/auth"
import { AnalysisClient } from "./analysis-loader"

export default async function AnalysisPage() {
  const user = await requireAuth()
  return <AnalysisClient saccoId={user.saccoId} />
}

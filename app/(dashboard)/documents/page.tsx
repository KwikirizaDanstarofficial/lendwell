export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { DocumentsClient } from "./documents-loader"

export default async function DocumentsPage() {
  const user = await requireAuth()
  return <DocumentsClient saccoId={user.saccoId} />
}

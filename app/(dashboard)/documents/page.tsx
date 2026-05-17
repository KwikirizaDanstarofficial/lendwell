import { requireAuth } from "@/lib/auth"
import { getAllDocuments, getMembersForDocuments } from "@/db/queries/documents"
import { DocumentsClient } from "./components/documents-client"

export const revalidate = 60

export default async function DocumentsPage() {
  const user = await requireAuth()
  const [docs, members] = await Promise.all([
    getAllDocuments(user.saccoId),
    getMembersForDocuments(user.saccoId),
  ])

  return <DocumentsClient documents={docs} members={members} />
}

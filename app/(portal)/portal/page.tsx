export const revalidate = 0
import { requireMember } from "@/lib/auth"
import { PortalPageClient } from "./portal-loader"

export default async function PortalPage() {
  const user = await requireMember()
  return <PortalPageClient memberCode={user.memberCode ?? ""} saccoId={user.saccoId} />
}

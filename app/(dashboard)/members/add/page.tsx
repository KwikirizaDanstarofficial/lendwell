export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { AddMemberForm } from "./add-member-loader"

export default async function AddMemberPage() {
  const user = await requireAuth()
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Member</h1>
        <p className="text-muted-foreground text-sm mt-1">Fill in the details to register a new member</p>
      </div>
      <AddMemberForm saccoId={user.saccoId} branches={[]} />
    </div>
  )
}

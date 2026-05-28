import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/server"
import { SecurityTab } from "@/app/(dashboard)/settings/components/security-tab"

export default async function BranchSettingsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  const { data: branch } = await supabaseAdmin
    .from("branches")
    .select("id, name, phone, email, address")
    .eq("code", code)
    .eq("sacco_id", user.saccoId)
    .single()

  if (!branch) redirect("/dashboard")

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Branch Settings</h1>
        <p className="text-sm text-muted-foreground">{branch.name}</p>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-1">
        <p className="text-sm font-medium">Branch Information</p>
        <dl className="mt-3 space-y-2 text-sm">
          {branch.phone && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Phone</dt>
              <dd>{branch.phone}</dd>
            </div>
          )}
          {branch.email && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Email</dt>
              <dd>{branch.email}</dd>
            </div>
          )}
          {branch.address && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Address</dt>
              <dd>{branch.address}</dd>
            </div>
          )}
          {!branch.phone && !branch.email && !branch.address && (
            <p className="text-muted-foreground">No contact details on file. Ask an admin to update them.</p>
          )}
        </dl>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm font-medium mb-4">Security</p>
        <SecurityTab />
      </div>
    </div>
  )
}

import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"

export default async function BranchMembersPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  const { data: branch } = await supabaseAdmin
    .from("branches")
    .select("id, name")
    .eq("code", code)
    .eq("sacco_id", user.saccoId)
    .single()

  if (!branch) redirect("/dashboard")

  const { data: members } = await supabaseAdmin
    .from("members")
    .select("id, member_code, full_name, phone, status, joined_at")
    .eq("branch_id", branch.id)
    .eq("sacco_id", user.saccoId)
    .order("joined_at", { ascending: false })

  const rows = members ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Members</h1>
          <p className="text-sm text-muted-foreground">{rows.length} member{rows.length !== 1 ? "s" : ""} in {branch.name}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-muted-foreground">
          <p className="text-sm font-medium">No members in this branch</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{m.member_code}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.joined_at ? new Date(m.joined_at).toLocaleDateString("en-UG") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        m.status === "active"
                          ? "border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "border-0 bg-muted text-muted-foreground"
                      }
                    >
                      {m.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

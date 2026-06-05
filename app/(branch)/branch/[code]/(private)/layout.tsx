import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/server"
import { BranchLogoutButton } from "@/app/(branch)/components/branch-logout-button"
import { BranchNav } from "@/app/(branch)/components/branch-nav"
import { TempPasswordBanner } from "@/components/layout/temp-password-banner"
import { GitBranch } from "lucide-react"

export default async function BranchLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const user = await getCurrentUser()

  if (!user) redirect("/auth/login")
  if (user.role !== "branch_admin") redirect("/dashboard")
  if (user.branchCode !== code) redirect(`/branch/${user.branchCode}/dashboard`)

  const { data: branch } = await supabaseAdmin
    .from("branches")
    .select("id, name, code")
    .eq("code", code)
    .eq("sacco_id", user.saccoId)
    .single()

  if (!branch) redirect("/dashboard")

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              <GitBranch className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">{branch.name}</p>
              <p className="text-xs text-muted-foreground">{branch.code} · {user.fullName}</p>
            </div>
          </div>
          <BranchLogoutButton />
        </div>
        <BranchNav code={code} />
      </header>
      {user.hasTempPassword && <TempPasswordBanner />}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  )
}

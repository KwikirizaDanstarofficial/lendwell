import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase/server"
import { LoginForm } from "@/app/auth/login/login-form"
import { LogoMark } from "@/components/logo"

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const { data } = await supabaseAdmin.from("branches").select("name").eq("code", code).single()
  return { title: `${data?.name ?? code} — Sign In` }
}

export default async function BranchLoginPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const { data: branchData } = await supabaseAdmin
    .from("branches")
    .select("id, name, code, address, phone")
    .eq("code", code)
    .single()

  const branch = branchData
    ? [{ id: branchData.id, name: branchData.name, code: branchData.code, address: branchData.address, phone: branchData.phone }]
    : []

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <span className="font-bold text-base tracking-tight">Lendwell</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm branches={branch} branchCode={code} />
          </div>
        </div>
      </div>

      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <LogoMark size={80} className="mb-6 drop-shadow-2xl" />
          <h1 className="mb-2 text-3xl font-bold tracking-tight">{branchData?.name ?? code}</h1>
          <p className="text-sm text-muted-foreground">Branch Login</p>
          {branchData?.address && (
            <p className="mt-4 text-sm text-muted-foreground">{branchData.address}</p>
          )}
        </div>
      </div>
    </div>
  )
}

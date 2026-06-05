import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LogoutButton } from "./components/logout-button"
import { TempPasswordBanner } from "@/components/layout/temp-password-banner"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")
  if (user.role !== "member") redirect("/dashboard")

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium leading-none">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.memberCode}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>
      {user.hasTempPassword && <TempPasswordBanner />}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  )
}

import type { Metadata } from "next"
import { LoginForm } from "./login-form"
import { LogoMark } from "@/components/logo"

export const metadata: Metadata = { title: "Sign In — SaccoOS" }

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* ── Left: form ── */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <span className="font-bold text-base tracking-tight">SaccoOS</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* ── Right: brand panel ── */}
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <LogoMark size={80} className="mb-6 drop-shadow-2xl" />
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
            SaccoOS
          </h1>
          <p className="mb-2 text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">
            Cooperative Management Platform
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Manage your SACCO members, loans, savings, and finances — all in one
            powerful platform built for cooperatives.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Members", icon: "👥" },
              { label: "Loans", icon: "💰" },
              { label: "Savings", icon: "🏦" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border/50 bg-background/60 p-4 backdrop-blur-sm"
              >
                <div className="mb-1 text-2xl">{item.icon}</div>
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

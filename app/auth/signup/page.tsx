import type { Metadata } from "next"
import { SignupForm } from "./signup-form"
import { LogoMark } from "@/components/logo"

export const metadata: Metadata = { title: "Create Account — SaccoOS" }

export default function SignupPage() {
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
            <SignupForm />
          </div>
        </div>
      </div>

      {/* ── Right: brand panel ── */}
      <div className="relative hidden lg:block">
        {/* Background photo */}
        <img
          src="/african-ladies-sacco.jpg"
          alt="African women in SACCO"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Dark gradient overlay so text remains legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        {/* Content anchored to the bottom */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col p-10">
          <LogoMark size={48} className="mb-4 drop-shadow-2xl" />
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">
            Get started today
          </h1>
          <p className="mb-8 max-w-sm text-sm leading-relaxed text-white/75">
            Your SACCO account is ready in minutes. Manage members, loans, savings,
            and finances from day one.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Members", desc: "Register & manage all your SACCO members" },
              { label: "Loans", desc: "Issue, track, and collect loan repayments" },
              { label: "Savings", desc: "Monitor deposits and member balances" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm"
              >
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white">{item.label}</p>
                <p className="text-[11px] leading-snug text-white/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import { UpdatePasswordForm } from "./update-password-form"
import { LogoMark } from "@/components/logo"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Set New Password — Lendwell" }

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <a href="/" className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <span className="font-bold text-base tracking-tight">Lendwell</span>
          </a>
        </div>
        <UpdatePasswordForm />
      </div>
    </div>
  )
}

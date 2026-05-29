"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { LogoMark } from "@/components/logo"

export default function OnboardingPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    saccoName: "",
    registrationNumber: "",
    country: "Uganda",
    contactEmail: "",
    contactPhone: "",
    address: "",
    website: "",
  })

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "Failed to create SACCO.")
          return
        }
        // Refresh the session so the new sacco_id metadata is in cookies.
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.error("[ONBOARDING] session refresh error:", refreshError)
        }
        router.refresh()
        router.push("/dashboard")
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <LogoMark size={56} className="drop-shadow-lg" />
          <h1 className="text-2xl font-bold">Set up your SACCO</h1>
          <p className="text-sm text-muted-foreground">
            Fill in your SACCO details. You can update these later in settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
                <circle cx={12} cy={12} r={10} />
                <line x1={12} y1={8} x2={12} y2={12} />
                <line x1={12} y1={16} x2="12.01" y2={16} />
              </svg>
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="saccoName">SACCO name <span className="text-destructive">*</span></Label>
            <Input id="saccoName" placeholder="e.g. Kampala Savings SACCO" value={form.saccoName} onChange={set("saccoName")} disabled={isPending} required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="registrationNumber">Registration number</Label>
              <Input id="registrationNumber" placeholder="e.g. SACCO/2024/001" value={form.registrationNumber} onChange={set("registrationNumber")} disabled={isPending} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="Uganda" value={form.country} onChange={set("country")} disabled={isPending} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input id="contactEmail" type="email" placeholder="info@mysacco.ug" value={form.contactEmail} onChange={set("contactEmail")} disabled={isPending} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input id="contactPhone" type="tel" placeholder="+256 700 000000" value={form.contactPhone} onChange={set("contactPhone")} disabled={isPending} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Physical address</Label>
            <Input id="address" placeholder="e.g. Plot 12, Kampala Road, Kampala" value={form.address} onChange={set("address")} disabled={isPending} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" type="url" placeholder="https://mysacco.ug" value={form.website} onChange={set("website")} disabled={isPending} />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={isPending || !form.saccoName.trim()}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up…
              </>
            ) : (
              "Continue to dashboard"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

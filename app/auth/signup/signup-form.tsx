"use client"
import { useState, useTransition } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"

type Step = "register" | "verify" | "credentials"

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
        <circle cx={12} cy={12} r={10} />
        <line x1={12} y1={8} x2={12} y2={12} />
        <line x1={12} y1={16} x2="12.01" y2={16} />
      </svg>
      {message}
    </div>
  )
}

function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false)
  const [visible, setVisible] = useState(!secret)

  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2.5">
        <span className="flex-1 font-mono text-sm break-all select-all">
          {secret && !visible ? "••••••••••••" : value}
        </span>
        {secret && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied
            ? <Check className="h-4 w-4 text-green-500" />
            : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function maskPhone(phone: string) {
  if (phone.length < 6) return phone
  return phone.slice(0, 4) + "***" + phone.slice(-3)
}

export function SignupForm({ className }: { className?: string }) {
  const [step, setStep] = useState<Step>("register")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [credentials, setCredentials] = useState<{ email: string; tempPassword: string } | null>(null)
  const [error, setError] = useState("")
  const [resent, setResent] = useState(false)
  const [isPending, startTransition] = useTransition()

  // ── Step 1: Register ───────────────────────────────────────────────────────
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim() }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? "Sign up failed."); return }
        setStep("verify")
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? "Verification failed."); return }
        setCredentials({ email: data.email, tempPassword: data.tempPassword })
        setStep("credentials")
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  const handleResend = () => {
    setError("")
    setResent(false)
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim() }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? "Could not resend."); return }
        setResent(true)
        setOtp("")
      } catch {
        setError("Could not resend. Please wait and try again.")
      }
    })
  }

  // ── Step 3: Credentials ────────────────────────────────────────────────────
  if (step === "credentials" && credentials) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <ShieldCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">Account created!</h1>
          <p className="text-sm text-muted-foreground">
            Your login details are shown below and were sent to{" "}
            <span className="font-medium text-foreground">{maskPhone(phone)}</span>.
          </p>
        </div>

        <div className="grid gap-3">
          <CopyField label="Your email address" value={credentials.email} />
          <CopyField label="Temporary password" value={credentials.tempPassword} secret />
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Save these credentials before continuing. You will be prompted to change your password after signing in.
        </div>

        <Button className="w-full" onClick={() => { window.location.href = "/auth/login" }}>
          Sign in now
        </Button>
      </div>
    )
  }

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  if (step === "verify") {
    return (
      <form className={cn("flex flex-col gap-6", className)} onSubmit={handleVerify}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Verify your phone</h1>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{maskPhone(phone)}</span>
          </p>
        </div>

        <div className="grid gap-4">
          {error && <ErrorAlert message={error} />}
          {resent && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50 px-3 py-2.5 text-sm text-green-700 dark:text-green-300">
              Previous code expired. A new code was sent to your phone.
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              disabled={isPending}
              autoFocus
              className="text-center text-xl tracking-[0.5em] font-mono"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending || otp.length !== 6}>
            {isPending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying…</>
              : "Verify"}
          </Button>

          <Button type="button" variant="outline" className="w-full" onClick={handleResend} disabled={isPending}>
            {isPending ? "Sending…" : resent ? "Code sent" : "Resend code"}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Wrong number?{" "}
          <button
            type="button"
            className="text-foreground underline underline-offset-4 hover:text-primary"
            onClick={() => { setStep("register"); setError(""); setOtp("") }}
          >
            Go back
          </button>
        </p>
      </form>
    )
  }

  // ── Step 1: Register ───────────────────────────────────────────────────────
  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleRegister}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create your SACCO account</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Enter your name and phone number to get started
        </p>
      </div>

      <div className="grid gap-4">
        {error && <ErrorAlert message={error} />}

        <div className="grid gap-2">
          <Label htmlFor="fullName">Your full name</Label>
          <Input
            id="fullName"
            placeholder="e.g. John Mukasa"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isPending}
            required
            autoFocus
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="0700 000 000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isPending}
            required
          />
          <p className="text-xs text-muted-foreground">
            A 6-digit verification code will be sent to this number.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending code…</>
            : "Continue"}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="/auth/login" className="text-foreground underline underline-offset-4 hover:text-primary">
          Sign in
        </a>
      </p>
    </form>
  )
}

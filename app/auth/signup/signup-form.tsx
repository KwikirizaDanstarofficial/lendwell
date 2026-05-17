"use client"
import { useState, useTransition } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Mail, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

type Step = "register" | "verify" | "done"

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

export function SignupForm({ className, ...props }: React.ComponentPropsWithoutRef<"form">) {
  const [step, setStep] = useState<Step>("register")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, email: email.trim().toLowerCase(), password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "Sign up failed.")
          return
        }
        setStep("verify")
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  const handleResend = () => {
    setError("")
    startTransition(async () => {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
      })
      if (resendError) setError("Could not resend. Please wait a moment and try again.")
    })
  }

  // ── Step: confirmed ──────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold">Email confirmed!</h1>
        <p className="text-sm text-muted-foreground">
          Your account is ready. Sign in to set up your SACCO.
        </p>
        <Button className="w-full max-w-xs mt-2" onClick={() => { window.location.href = "/auth/login" }}>
          Sign in now
        </Button>
      </div>
    )
  }

  // ── Step: email link verify ──────────────────────────────────────────────────
  if (step === "verify") {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{email}</span>.
            Click the link in the email to activate your account.
          </p>
        </div>

        {error && <ErrorAlert message={error} />}

        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive the email?{" "}
          <button
            type="button"
            className="text-foreground underline underline-offset-4 hover:text-primary disabled:opacity-50"
            onClick={handleResend}
            disabled={isPending}
          >
            {isPending ? "Sending…" : "Resend email"}
          </button>
        </p>

        <p className="text-center text-sm text-muted-foreground">
          Wrong address?{" "}
          <button
            type="button"
            className="text-foreground underline underline-offset-4 hover:text-primary"
            onClick={() => { setStep("register"); setError("") }}
          >
            Go back
          </button>
        </p>
      </div>
    )
  }

  // ── Step: register ───────────────────────────────────────────────────────────
  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSignup} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create your SACCO account</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Set up your admin account, then configure your SACCO details
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
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@mysacco.ug"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
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

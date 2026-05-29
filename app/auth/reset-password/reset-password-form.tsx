"use client"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MailCheck } from "lucide-react"

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

export function ResetPasswordForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? "Could not send reset link."); return }
        setSent(true)
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <MailCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If <span className="font-medium text-foreground">{email}</span> is registered,
            you'll receive a password reset link shortly.
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          The link expires in 1 hour. Check your spam folder if you don't see it.
        </div>
        <Button variant="outline" className="w-full" onClick={() => { window.location.href = "/auth/login" }}>
          Back to sign in
        </Button>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <div className="grid gap-4">
        {error && <ErrorAlert message={error} />}

        <div className="grid gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            required
            autoFocus
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending || !email}>
          {isPending
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
            : "Send reset link"}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <a href="/auth/login" className="text-foreground underline underline-offset-4 hover:text-primary">
          Sign in
        </a>
      </p>
    </form>
  )
}

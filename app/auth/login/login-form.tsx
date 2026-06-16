"use client"

import { useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Building2, GitBranch, MapPin, Phone } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { isOffline } from "@/lib/utils/is-offline"

const LS_SESSION_KEY = "lendwell-session"

type BranchItem = { id: string; name: string; code: string; address: string | null; phone: string | null }

interface LoginFormProps {
  className?: string
  branches?: BranchItem[]
  branchCode?: string
}

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

function PasswordField({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id="password"
        type={show ? "text" : "password"}
        placeholder="••••••••"
        autoComplete="current-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

function LoginCredentialsForm({
  redirect,
  forceBranchCode,
}: {
  redirect: string
  forceBranchCode?: string
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const isElectron = typeof window !== "undefined" && "electron" in window

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email || !password) { setError("Please enter your email and password."); return }
    startTransition(async () => {
      try {
        if (isElectron) {
          const isOnline = (window as any).electronApp?.isOnline?.()
          if (isOnline === false) {
            const hasVault = await window.electron.vaultExists()
            if (hasVault) {
              window.location.href = "/dashboard"
              return
            }
            setError("You are offline. Please connect to the internet to sign in.")
            return
          }
          // Authenticate and store session in vault
          await window.electron.login(email.trim().toLowerCase(), password)
          // Also save to localStorage for offline startup resilience
          try {
            const conf = await window.electron.getConfig()
            if (conf.accessToken) {
              localStorage.setItem(LS_SESSION_KEY, JSON.stringify({
                accessToken: conf.accessToken,
                refreshToken: conf.refreshToken ?? conf.accessToken,
                savedAt: Date.now(),
              }))
            }
          } catch {}
          // Set session cookies for server-side auth
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
          })
          const data = await res.json()
          if (!res.ok) { setError(data.error ?? "Invalid email or password."); return }
          if (data.role === "member") {
            window.location.href = "/portal"
          } else if (data.role === "branch_admin" && data.branchCode) {
            window.location.href = `/branch/${data.branchCode}/dashboard`
          } else if (!data.hasSaccoId) {
            window.location.href = "/onboarding"
          } else {
            const safeRedirect = redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/dashboard"
            window.location.href = safeRedirect
          }
          return
        }

        // Web: use existing API route
        if (isOffline()) {
          // Offline — try cached session
          const { data: { session } } = await supabase.auth.getSession()
          if (session && session.expires_at && session.expires_at * 1000 > Date.now()) {
            const redirectTo = redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/dashboard"
            window.location.href = redirectTo
            return
          }
          setError("You are offline. Please connect to the internet to sign in.")
          return
        }
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? "Invalid email or password."); return }

        // Save session to localStorage for offline resilience
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.access_token && session?.refresh_token) {
            localStorage.setItem(LS_SESSION_KEY, JSON.stringify({
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
              savedAt: Date.now(),
            }))
          }
        } catch {}

        if (data.role === "member") {
          window.location.href = "/portal"
        } else if (data.role === "branch_admin" && data.branchCode) {
          window.location.href = `/branch/${data.branchCode}/dashboard`
        } else if (!data.hasSaccoId) {
          window.location.href = "/onboarding"
        } else {
          const safeRedirect = redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/dashboard"
          window.location.href = safeRedirect
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong. Please try again.")
      }
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {error && <ErrorAlert message={error} />}
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a
            href="/auth/reset-password"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Forgot password?
          </a>
        </div>
        <PasswordField value={password} onChange={setPassword} disabled={isPending} />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : "Sign In"}
      </Button>
    </form>
  )
}

export function LoginForm({ className, branches = [], branchCode }: LoginFormProps) {
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/dashboard"
  const hasBranches = branches.length > 0
  const [tab, setTab] = useState<"main" | "branch">("main")
  const isElectron = typeof window !== "undefined" && "electron" in window

  // Electron: always show main login, no branch selection
  if (isElectron) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground">Enter your email and password</p>
        </div>
        <LoginCredentialsForm redirect={redirect} />
      </div>
    )
  }

  if (branchCode) {
    const branch = branches.find((b) => b.code === branchCode)
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-1">
            <GitBranch className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">{branch?.name ?? branchCode}</h1>
          <p className="text-sm text-muted-foreground">Sign in to your branch account</p>
        </div>
        <LoginCredentialsForm redirect={redirect} forceBranchCode={branchCode} />
        <p className="text-center text-sm text-muted-foreground">
          <a href="/auth/login" className="text-foreground underline underline-offset-4 hover:text-primary">
            ← Back to main login
          </a>
        </p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Sign in to your account</h1>
        <p className="text-sm text-muted-foreground">Enter your email and password</p>
      </div>

      {hasBranches && (
        <div className="flex rounded-lg border p-1 gap-1">
          <button
            type="button"
            onClick={() => setTab("main")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "main"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            Main Office
          </button>
          <button
            type="button"
            onClick={() => setTab("branch")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "branch"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GitBranch className="h-3.5 w-3.5" />
            Branch Login
          </button>
        </div>
      )}

      {tab === "main" || !hasBranches ? (
        <LoginCredentialsForm redirect={redirect} />
      ) : (
        <div className="grid gap-3">
          <p className="text-xs text-muted-foreground text-center">Select your branch to sign in</p>
          {branches.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <GitBranch className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm leading-tight">{b.name}</p>
                <p className="text-xs font-mono text-muted-foreground">{b.code}</p>
                {b.address && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                    <MapPin className="h-3 w-3 shrink-0" />{b.address}
                  </p>
                )}
                {b.phone && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />{b.phone}
                  </p>
                )}
              </div>
              <a
                href={`/branch/${b.code}/login`}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Login
              </a>
            </div>
          ))}
        </div>
      )}

      {(tab === "main" || !hasBranches) && (
        <p className="text-center text-sm text-muted-foreground">
          No account yet?{" "}
          <a href="/auth/signup" className="text-foreground underline underline-offset-4 hover:text-primary">
            Create one
          </a>
        </p>
      )}
    </div>
  )
}

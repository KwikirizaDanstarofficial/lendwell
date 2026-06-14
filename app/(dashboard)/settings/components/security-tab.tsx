"use client"
import { useState, useEffect } from "react"
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppLockContext } from "@/components/providers/app-lock-provider"
import { Switch } from "@/components/ui/switch"

export function SecurityTab({ onComplete }: { onComplete?: () => void } = {}) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.")
      return
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to change password.")
        return
      }
      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      if (onComplete) {
        setTimeout(onComplete, 1200)
      } else {
        // Reload to clear the temp password banner
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const appLock = useAppLockContext()
  const [appLockEnabled, setAppLockEnabled] = useState(false)
  const [setupPin, setSetupPin] = useState("")
  const [confirmSetupPin, setConfirmSetupPin] = useState("")
  const [currentUnlockPin, setCurrentUnlockPin] = useState("")
  const [showSetupPin, setShowSetupPin] = useState(false)
  const [pinError, setPinError] = useState("")
  const [pinSuccess, setPinSuccess] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  useEffect(() => {
    setAppLockEnabled(appLock.hasPin())
  }, [appLock])

  function handleEnableAppLock() {
    if (appLock.hasPin()) {
      appLock.disable()
      setAppLockEnabled(false)
    } else {
      setAppLockEnabled(true)
    }
  }

  function handleSavePin() {
    setPinError("")
    if (setupPin.length !== 4) {
      setPinError("PIN must be exactly 4 digits.")
      return
    }
    if (setupPin !== confirmSetupPin) {
      setPinError("PINs do not match.")
      return
    }
    appLock.setPin(setupPin)
    setPinSuccess(true)
    setSetupPin("")
    setConfirmSetupPin("")
    setTimeout(() => setPinSuccess(false), 2000)
  }

  function handleDisableWithPin() {
    setPinError("")
    const ok = appLock.unlock(currentUnlockPin)
    if (!ok) {
      setPinError("Incorrect PIN.")
      return
    }
    appLock.disable()
    setAppLockEnabled(false)
    setCurrentUnlockPin("")
    setShowRemoveConfirm(false)
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <ShieldCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <p className="font-semibold text-lg">Password changed successfully</p>
          <p className="text-sm text-muted-foreground">Your account is now secured with your new password.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Enter your current password and choose a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="current-password">Current password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Changing password…</>
                : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>App Lock</CardTitle>
          <CardDescription>
            Set a 4-digit PIN to lock the app when idle or when you switch tabs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Require PIN to open app</span>
            </div>
            <Switch checked={appLockEnabled} onCheckedChange={handleEnableAppLock} />
          </div>

          {appLockEnabled && !appLock.hasPin() && (
            <div className="space-y-3 border-t pt-4">
              <div className="grid gap-2">
                <Label htmlFor="setup-pin">New PIN</Label>
                <Input
                  id="setup-pin"
                  type={showSetupPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="4 digits"
                  value={setupPin}
                  onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="max-w-[200px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-setup-pin">Confirm PIN</Label>
                <Input
                  id="confirm-setup-pin"
                  type={showSetupPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="Re-enter PIN"
                  value={confirmSetupPin}
                  onChange={(e) => setConfirmSetupPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="max-w-[200px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSavePin} disabled={!setupPin || !confirmSetupPin}>
                  {pinSuccess ? <><Check className="mr-1 h-4 w-4" />Saved</> : "Save PIN"}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowSetupPin((v) => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {showSetupPin ? "Hide" : "Show"} PIN
                </button>
              </div>
              {pinError && <p className="text-xs text-destructive">{pinError}</p>}
              {pinSuccess && <p className="text-xs text-green-600 dark:text-green-400">PIN saved successfully.</p>}
            </div>
          )}

          {appLock.hasPin() && (
            <div className="border-t pt-4">
              {!showRemoveConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRemoveConfirm(true)}
                  className="text-destructive"
                >
                  Remove PIN
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Enter your current PIN to remove the app lock.</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      placeholder="Current PIN"
                      value={currentUnlockPin}
                      onChange={(e) => setCurrentUnlockPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="max-w-[160px]"
                    />
                    <Button size="sm" variant="outline" onClick={handleDisableWithPin} disabled={!currentUnlockPin}>
                      Confirm
                    </Button>
                    <button
                      type="button"
                      onClick={() => { setShowRemoveConfirm(false); setPinError(""); setCurrentUnlockPin("") }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                  {pinError && <p className="text-xs text-destructive">{pinError}</p>}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

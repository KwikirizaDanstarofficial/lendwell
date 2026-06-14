"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAppLock } from "@/hooks/use-app-lock"
import { AppLockScreen } from "@/components/layout/app-lock-screen"

interface AppLockContextValue {
  isLocked: boolean
  enabled: boolean
  lock: () => void
  unlock: (pin: string) => boolean
  setPin: (pin: string) => void
  disable: () => void
  hasPin: () => boolean
  isEnabled: () => boolean
}

const AppLockContext = createContext<AppLockContextValue>({
  isLocked: false,
  enabled: false,
  lock: () => {},
  unlock: () => false,
  setPin: () => {},
  disable: () => {},
  hasPin: () => false,
  isEnabled: () => false,
})

export function AppLockProvider({ children, logo }: { children: ReactNode; logo?: string }) {
  const { isLocked, enabled, resolved, lock, unlock, setPin, disable, hasPin, isEnabled } = useAppLock()
  const router = useRouter()

  const handleForgotPin = useCallback(() => {
    disable()
    router.push("/auth/login")
  }, [disable, router])

  if (!resolved) {
    return (
      <AppLockContext.Provider value={{ isLocked, enabled, lock, unlock, setPin, disable, hasPin, isEnabled }}>
        {null}
      </AppLockContext.Provider>
    )
  }

  return (
    <AppLockContext.Provider value={{ isLocked, enabled, lock, unlock, setPin, disable, hasPin, isEnabled }}>
      {isLocked && <AppLockScreen onUnlock={unlock} onForgotPin={handleForgotPin} logo={logo} />}
      {children}
    </AppLockContext.Provider>
  )
}

export function useAppLockContext(): AppLockContextValue {
  return useContext(AppLockContext)
}

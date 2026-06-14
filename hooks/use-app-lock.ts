"use client"

import { useCallback, useEffect, useState } from "react"

const LOCK_PIN_KEY = "app-lock-pin"
const LOCK_ENABLED_KEY = "app-lock-enabled"

function hashPin(pin: string): string {
  return btoa(pin)
}

function getStoredHash(): string | null {
  try {
    return localStorage.getItem(LOCK_PIN_KEY)
  } catch {
    return null
  }
}

function getEnabled(): boolean {
  try {
    return localStorage.getItem(LOCK_ENABLED_KEY) === "true"
  } catch {
    return false
  }
}

export function useAppLock() {
  const [enabled, setEnabledState] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    const actualEnabled = getEnabled()
    setEnabledState(actualEnabled)
    if (actualEnabled && getStoredHash()) {
      setIsLocked(true)
    }
    setResolved(true)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setIsLocked(false)
      return
    }

    const storedHash = getStoredHash()
    if (!storedHash) {
      setIsLocked(false)
      return
    }

    setIsLocked(true)
  }, [enabled])

  const lock = useCallback(() => {
    if (enabled && getStoredHash()) {
      setIsLocked(true)
    }
  }, [enabled])

  const unlock = useCallback((pin: string): boolean => {
    const storedHash = getStoredHash()
    if (!storedHash) return false
    if (hashPin(pin) !== storedHash) return false
    setIsLocked(false)
    return true
  }, [])

  const setPin = useCallback((pin: string) => {
    try {
      localStorage.setItem(LOCK_PIN_KEY, hashPin(pin))
      localStorage.setItem(LOCK_ENABLED_KEY, "true")
      setEnabledState(true)
    } catch {}
  }, [])

  const disable = useCallback(() => {
    try {
      localStorage.removeItem(LOCK_PIN_KEY)
      localStorage.removeItem(LOCK_ENABLED_KEY)
      setEnabledState(false)
      setIsLocked(false)
    } catch {}
  }, [])

  const hasPin = useCallback((): boolean => {
    return !!getStoredHash()
  }, [])

  const isEnabled = useCallback((): boolean => {
    return getEnabled()
  }, [])

  return { isLocked, enabled, resolved, lock, unlock, setPin, disable, hasPin, isEnabled }
}

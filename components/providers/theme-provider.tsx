"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  resolvedTheme: ResolvedTheme
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
})

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(resolved: ResolvedTheme, disableTransition = false) {
  if (disableTransition) {
    const style = document.createElement("style")
    style.appendChild(document.createTextNode("*,*::before,*::after{transition:none!important}"))
    document.head.appendChild(style)
    window.getComputedStyle(document.body)
    setTimeout(() => document.head.removeChild(style), 1)
  }
  document.documentElement.classList.toggle("dark", resolved === "dark")
  document.documentElement.style.colorScheme = resolved
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode
  defaultTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light")

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme | null) ?? defaultTheme
    setThemeState(saved)
    const resolved = saved === "system" ? getSystemTheme() : (saved as ResolvedTheme)
    setResolvedTheme(resolved)
    applyTheme(resolved)

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      // only react to system changes when current preference is "system"
      setThemeState((current) => {
        if (current === "system") {
          const r = getSystemTheme()
          setResolvedTheme(r)
          applyTheme(r)
        }
        return current
      })
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [defaultTheme])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    try { localStorage.setItem("theme", t) } catch {}
    const resolved = t === "system" ? getSystemTheme() : (t as ResolvedTheme)
    setResolvedTheme(resolved)
    applyTheme(resolved, true)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

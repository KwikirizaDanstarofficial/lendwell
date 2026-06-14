import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { AppLockProvider } from "@/components/providers/app-lock-provider"
import { getCurrentUser } from "@/lib/auth"
import { TopNav } from "@/components/layout/top-nav"
import { TempPasswordBanner } from "@/components/layout/temp-password-banner"
import { PowerSyncProvider } from "@/lib/powersync/provider"
import "./globals.css"
import { cn } from "@/lib/utils"
import { ElectronStartupCheck } from "@/components/layout/electron-startup-check"

export const metadata: Metadata = {
  title: { default: "Lendwell", template: "%s — Lendwell" },
  description: "Cooperative Management Platform",
  manifest: "/manifest.json",
  applicationName: "Lendwell",
  icons: [
    { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    { url: "/lendwell-logo-primary.jpg", type: "image/jpeg" },
  ],
}
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F59E0B",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  let body = children

  if (user) {
    body = (
      <PowerSyncProvider>
        <div className="min-h-screen flex flex-col">
          <TopNav user={{ fullName: user.fullName, email: user.email, role: user.role, saccoId: user.saccoId }} />
          {user.hasTempPassword && <TempPasswordBanner />}
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </PowerSyncProvider>
    )
  }

  return (
    <html lang="en" suppressHydrationWarning className={cn("antialiased")}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `window.__CONFIG__=${JSON.stringify({
          supabaseUrl: process.env.SUPABASE_URL ?? "",
          supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
          powersyncUrl: process.env.POWERSYNC_URL ?? "",
          flwPublicKey: process.env.FLW_PUBLIC_KEY ?? "",
          appUrl: process.env.APP_URL ?? "",
          saccoName: process.env.SACCO_NAME ?? "My SACCO",
        }).replace(/<\/script>/gi,"<\\/script>")};` }} />
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}` }} />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <Suspense fallback={null}>
          <ThemeProvider>
            <AppLockProvider>
              <ElectronStartupCheck />
              {body}
              <Toaster richColors position="top-right" />
            </AppLockProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  )
}

import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { getCurrentUser } from "@/lib/auth"
import { TopNav } from "@/components/layout/top-nav"
import { TempPasswordBanner } from "@/components/layout/temp-password-banner"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "SaccoOS", template: "%s — SaccoOS" },
  description: "Cooperative Management Platform",
  manifest: "/manifest.json",
  applicationName: "SaccoOS",
  icons: [
    { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    { url: "/lendwell-logo-primary.svg", type: "image/svg+xml" },
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
      <div className="min-h-screen flex flex-col">
        <TopNav user={user} />
        {user.hasTempPassword && <TempPasswordBanner />}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    )
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}` }} />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Cabinet+Grotesk:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <Suspense fallback={null}>
          <ThemeProvider>
            {body}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  )
}

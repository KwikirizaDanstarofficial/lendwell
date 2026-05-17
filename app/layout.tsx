import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ClientHeader } from "@/components/ui/client-header"
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
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <ClientHeader user={user} />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Cabinet+Grotesk:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <QueryProvider>
          <Suspense fallback={null}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {body}
              <Toaster richColors position="top-right" />
            </ThemeProvider>
          </Suspense>
        </QueryProvider>
      </body>
    </html>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Login page handles its own full layout (login-02 pattern)
  // Onboarding wraps itself in a centered container
  return <>{children}</>
}

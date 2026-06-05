import Image from "next/image"

interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 56, className }: LogoMarkProps) {
  return (
    <Image
      src="/lendwell-logo-primary.svg"
      alt="Lendwell"
      width={size}
      height={size}
      className={className}
      priority
    />
  )
}

interface LogoProps {
  variant?: "dark" | "light"
  height?: number
  className?: string
}

export function Logo({ variant = "dark", height = 40, className }: LogoProps) {
  const src =
    variant === "light" ? "/lendwell-logo-primary.svg" : "/lendwell-logo-dark.svg"
  return (
    <Image
      src={src}
      alt="Lendwell — Cooperative Management Platform"
      width={height * 4.6}
      height={height}
      className={className}
      priority
    />
  )
}

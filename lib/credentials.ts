const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&"

export function generateEmail(fullName: string): string {
  const parts = fullName.trim().toLowerCase().split(/\s+/)
  const first = parts[0].replace(/[^a-z0-9]/g, "")
  const last = (parts[1] ?? parts[0]).replace(/[^a-z0-9]/g, "")
  const digits = String(Math.floor(10 + Math.random() * 90))
  const domain = process.env.SACCO_EMAIL_DOMAIN ?? "mysacco.app"
  return `${first}.${last}${digits}@${domain}`
}

export function generatePassword(length = 12): string {
  let result = ""
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return result
}

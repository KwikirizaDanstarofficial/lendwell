/**
 * In-memory OTP store
 * In production, replace with Redis or a DB table
 */

interface OtpEntry {
  code: string
  expires: number
  attempts: number
}

const store = new Map<string, OtpEntry>()

export const OtpStore = {
  set(phone: string, code: string) {
    store.set(phone, {
      code,
      expires: Date.now() + 5 * 60 * 1000, // 5 min
      attempts: 0,
    })
  },

  verify(phone: string, code: string): "ok" | "expired" | "invalid" | "not_found" | "too_many" {
    const entry = store.get(phone)
    if (!entry) return "not_found"
    if (Date.now() > entry.expires) {
      store.delete(phone)
      return "expired"
    }
    entry.attempts++
    if (entry.attempts > 5) return "too_many"
    if (entry.code !== code) return "invalid"
    store.delete(phone)
    return "ok"
  },

  delete(phone: string) {
    store.delete(phone)
  },
}

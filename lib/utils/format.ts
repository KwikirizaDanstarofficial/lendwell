export function formatUGX(cents: number): string {
  return `UGX ${(cents / 100).toLocaleString("en-UG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-UG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—"
  return new Date(date).toLocaleString("en-UG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
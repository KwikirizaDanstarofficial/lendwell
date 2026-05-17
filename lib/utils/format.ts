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
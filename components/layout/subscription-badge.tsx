import { Badge } from "@/components/ui/badge"
import { Crown } from "lucide-react"

export function SubscriptionBadge() {
  const plan = "Starter"

  return (
    <Badge
      variant="outline"
      className="hidden md:flex items-center gap-1 border-primary/40 text-primary text-xs font-medium px-2 py-0.5"
    >
      <Crown className="h-3 w-3" />
      {plan}
    </Badge>
  )
}
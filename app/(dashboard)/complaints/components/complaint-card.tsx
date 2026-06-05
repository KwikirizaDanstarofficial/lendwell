"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Tag, MessageSquare } from "lucide-react"
import { type Complaint } from "./complaints-table"
import {
  priorityColors,
  statusColors,
  categoryLabels,
  categoryColors,
} from "./complaints-client"
import { formatDate } from "@/lib/utils/format"

export function ComplaintCard({ complaint }: { complaint: Complaint }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {complaint.subject}
          </CardTitle>
          <div className="flex shrink-0 gap-1">
            <Badge
              variant="outline"
              className={`text-[10px] ${statusColors[complaint.status ?? "open"]}`}
            >
              {complaint.status === "in_progress" ? "In Progress" : complaint.status}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] ${priorityColors[complaint.priority ?? "normal"]}`}
            >
              {complaint.priority}
            </Badge>
          </div>
        </div>
        {complaint.complaintRef && (
          <p className="font-mono text-[10px] text-muted-foreground">
            {complaint.complaintRef}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <p className="line-clamp-2 text-muted-foreground">{complaint.body}</p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
          {complaint.memberName && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {complaint.memberName}
            </span>
          )}
          {complaint.category && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ${categoryColors[complaint.category] ?? ""}`}
            >
              <Tag className="h-3 w-3" />
              {categoryLabels[complaint.category] ?? complaint.category}
            </span>
          )}
          {complaint.createdAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(complaint.createdAt)}
            </span>
          )}
        </div>

        {complaint.resolvedAt && complaint.satisfactionRating && (
          <div className="flex items-center gap-1 text-yellow-600">
            <MessageSquare className="h-3 w-3" />
            <span>Rating: {complaint.satisfactionRating}/5</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

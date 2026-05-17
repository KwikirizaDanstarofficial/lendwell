"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  CheckCircle,
  Clock,
  PlayCircle,
  User,
  Calendar,
  Tag,
  AlertCircle,
  Star,
  MessageSquare,
  FileText,
} from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { updateComplaintStatusAction, submitRatingAction } from "../actions"
import { toast } from "sonner"
import { ResolveDialog } from "./resolve-dialog"
import {
  priorityColors,
  statusColors,
  categoryLabels,
  categoryColors,
} from "./complaints-client"
import { type Complaint } from "./complaints-table"

export function ComplaintDetailDialog({
  complaint,
  open,
  onClose,
}: {
  complaint: Complaint
  open: boolean
  onClose: () => void
}) {
  const [resolveOpen, setResolveOpen] = useState(false)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [rating, setRating] = useState(complaint.satisfactionRating ?? 0)
  const [feedback, setFeedback] = useState(complaint.feedback ?? "")
  const [submittingRating, setSubmittingRating] = useState(false)

  const handleMarkInProgress = async () => {
    const res = await updateComplaintStatusAction(complaint.id, "in_progress")
    if (res.success) toast.success("Marked as in progress")
    else toast.error(res.error)
  }

  const handleSubmitRating = async () => {
    if (!rating) return
    setSubmittingRating(true)
    const res = await submitRatingAction(complaint.id, rating, feedback)
    setSubmittingRating(false)
    if (res.success) toast.success("Rating submitted!")
    else toast.error(res.error)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Complaint Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Header Info */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-muted px-2 py-1 font-mono text-sm text-muted-foreground">
                {complaint.complaintRef ?? "No Ref"}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[complaint.status || "open"]}`}
              >
                {complaint.status === "in_progress"
                  ? "In Progress"
                  : complaint.status}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${priorityColors[complaint.priority ?? "normal"]}`}
              >
                {complaint.priority ?? "normal"} priority
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${categoryColors[complaint.category ?? "general"]}`}
              >
                <Tag className="h-3 w-3" />
                {categoryLabels[complaint.category ?? "general"]}
              </span>
            </div>

            {/* Subject */}
            <div>
              <h2 className="text-lg font-bold">{complaint.subject}</h2>
            </div>

            {/* Member Info */}
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Member</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {complaint.memberName ?? "Anonymous"}
                    </p>
                  </div>
                  {complaint.memberCode && (
                    <div>
                      <p className="text-xs text-muted-foreground">Code</p>
                      <p className="font-mono">{complaint.memberCode}</p>
                    </div>
                  )}
                  {complaint.memberPhone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p>{complaint.memberPhone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p>{formatDate(complaint.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Complaint Body */}
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Complaint Description</p>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {complaint.body}
                </p>
                {complaint.notes && (
                  <div className="mt-3 border-t pt-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      Internal Notes
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {complaint.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resolution */}
            {complaint.resolutionNotes && (
              <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                <CardContent className="pt-4 pb-3">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Resolution
                    </p>
                    {complaint.resolvedAt && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatDate(complaint.resolvedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">
                    {complaint.resolutionNotes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Timeline</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-500" />
                    <div className="text-sm">
                      <span className="font-medium">Submitted</span>
                      <span className="ml-2 text-muted-foreground">
                        {formatDate(complaint.createdAt)}
                      </span>
                    </div>
                  </div>
                  {complaint.status === "in_progress" && (
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                      <div className="text-sm">
                        <span className="font-medium">In Progress</span>
                        <span className="ml-2 text-muted-foreground">
                          {formatDate(complaint.updatedAt)}
                        </span>
                      </div>
                    </div>
                  )}
                  {complaint.resolvedAt && (
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
                      <div className="text-sm">
                        <span className="font-medium">Resolved</span>
                        <span className="ml-2 text-muted-foreground">
                          {formatDate(complaint.resolvedAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Satisfaction Rating */}
            {complaint.status === "resolved" && (
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <p className="text-sm font-semibold">Satisfaction Rating</p>
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {rating}/5
                      </span>
                    )}
                  </div>
                  <textarea
                    className="min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    placeholder="Optional feedback..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={handleSubmitRating}
                    disabled={!rating || submittingRating}
                  >
                    {submittingRating ? "Saving..." : "Submit Rating"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              {complaint.status === "open" && (
                <Button
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
                  onClick={handleMarkInProgress}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Mark In Progress
                </Button>
              )}
              {complaint.status !== "resolved" && (
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={() => setResolveOpen(true)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolve Complaint
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ResolveDialog
        complaint={complaint}
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
      />
    </>
  )
}

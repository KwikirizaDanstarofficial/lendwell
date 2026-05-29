"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  MoreVertical,
  Eye,
  CheckCircle,
  Clock,
  Trash2,
  User,
  Calendar,
  Tag,
  Star,
  PlayCircle,
} from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { updateComplaintStatusAction, deleteComplaintAction } from "../actions"
import { toast } from "sonner"
import { ComplaintDetailDialog } from "./complaint-detail-dialog"
import { ResolveDialog } from "./resolve-dialog"
import {
  priorityColors,
  statusColors,
  categoryLabels,
  categoryColors,
} from "./complaints-client"
import { type Complaint } from "./complaints-table"

export function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const res = await deleteComplaintAction(complaint.id)
    setDeleting(false)
    if (res.success) {
      toast.success("Complaint deleted")
      setDeleteOpen(false)
    } else {
      toast.error(res.error)
    }
  }

  const handleMarkInProgress = async () => {
    const res = await updateComplaintStatusAction(complaint.id, "in_progress")
    if (res.success) toast.success("Marked as in progress")
    else toast.error(res.error)
  }

  const isResolved = complaint.status === "resolved"
  const isUrgent = complaint.priority === "urgent"
  const isHigh = complaint.priority === "high"

  return (
    <>
      <Card
        className={`flex cursor-pointer flex-col transition-all duration-200 hover:shadow-md ${
          isUrgent
            ? "border-red-300 dark:border-red-800"
            : isHigh
              ? "border-orange-300 dark:border-orange-800"
              : ""
        }`}
        onClick={() => setDetailOpen(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {/* Ref + Priority */}
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {complaint.complaintRef ?? "—"}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[complaint.priority ?? "normal"]}`}
                >
                  {complaint.priority ?? "normal"}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[complaint.status || "open"]}`}
                >
                  {complaint.status === "in_progress"
                    ? "In Progress"
                    : complaint.status}
                </span>
              </div>

              {/* Subject */}
              <h3 className="line-clamp-1 text-base leading-tight font-semibold">
                {complaint.subject}
              </h3>
            </div>

            {/* Actions Menu */}
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setDetailOpen(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>

                  {complaint.status === "open" && (
                    <DropdownMenuItem
                      onClick={handleMarkInProgress}
                      className="text-blue-600"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Mark In Progress
                    </DropdownMenuItem>
                  )}

                  {complaint.status !== "resolved" && (
                    <DropdownMenuItem
                      onClick={() => setResolveOpen(true)}
                      className="text-green-600"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Resolve
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3 pt-0">
          {/* Body Preview */}
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {complaint.body}
          </p>

          {/* Category */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[complaint.category ?? "general"]}`}
            >
              <Tag className="h-3 w-3" />
              {categoryLabels[complaint.category ?? "general"]}
            </span>
          </div>

          {/* Member + Date */}
          <div className="mt-auto space-y-1 border-t pt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-medium text-foreground">
                {complaint.memberName ?? "Anonymous"}
              </span>
              {complaint.memberCode && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="font-mono">{complaint.memberCode}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDate(complaint.createdAt)}
              {complaint.resolvedAt && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-green-600">
                    Resolved {formatDate(complaint.resolvedAt)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Rating Stars if resolved */}
          {isResolved && complaint.satisfactionRating && (
            <div className="flex items-center gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${
                    star <= (complaint.satisfactionRating || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
              <span className="ml-1 text-xs text-muted-foreground">
                {complaint.satisfactionRating}/5
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex-1 text-xs"
              onClick={() => setDetailOpen(true)}
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              View
            </Button>
            {complaint.status !== "resolved" && (
              <Button
                size="sm"
                className="h-8 flex-1 bg-green-600 text-xs text-white hover:bg-green-700"
                onClick={() => setResolveOpen(true)}
              >
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Resolve
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ComplaintDetailDialog
        complaint={complaint}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      <ResolveDialog
        complaint={complaint}
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Complaint?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete complaint{" "}
              <strong>{complaint.complaintRef}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

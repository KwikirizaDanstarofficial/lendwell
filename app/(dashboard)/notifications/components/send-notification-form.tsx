"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { sendNotificationAction } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Send } from "lucide-react"

const initialState: { success?: boolean; error?: string; sent?: number } = {}

export function SendNotificationForm({ members }: { members: any[] }) {
  const [state, formAction, isPending] = useActionState(
    sendNotificationAction,
    initialState
  )

  useEffect(() => {
    if (state.success) {
      toast.success(`Notification sent to ${state.sent} member(s).`)
    }
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="space-y-4">
      {/* Target */}
      <div className="space-y-1.5">
        <Label>Send To</Label>
        <Select name="target" defaultValue="all">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            <SelectItem value="active">Active Members Only</SelectItem>
            <SelectItem value="member">Specific Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Member Selection (conditional) */}
      <div className="space-y-1.5">
        <Label>Select Member</Label>
        <Select name="member_id">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a member" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.fullName} · {m.memberCode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          placeholder="Notification title"
          required
        />
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <Label htmlFor="body">Message *</Label>
        <textarea
          id="body"
          name="body"
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Write your notification message..."
          required
        />
      </div>

      {/* Channel + Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Channel</Label>
          <Select name="channel" defaultValue="in_app">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_app">In-App</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select name="priority" defaultValue="normal">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send Notification
        </Button>
      </div>
    </form>
  )
}

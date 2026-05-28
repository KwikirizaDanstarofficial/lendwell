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
import { SearchableSelect } from "@/components/ui/searchable-select"

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
    <div className="max-w-md">
      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Send To</Label>
            <Select name="target" defaultValue="all">
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="member">Specific Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Channel</Label>
            <Select name="channel" defaultValue="in_app">
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_app">In-App</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Member</Label>
          <SearchableSelect
            name="member_id"
            placeholder="Choose a member"
            searchPlaceholder="Search by name or code..."
            options={members.map((m: any) => ({
              value: m.id,
              label: m.full_name,
              sub: m.member_code,
            }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs">Title *</Label>
          <Input id="title" name="title" placeholder="Notification title" required className="h-8 text-xs" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="body" className="text-xs">Message *</Label>
          <textarea
            id="body"
            name="body"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Write your message..."
            required
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="space-y-1.5 w-32">
            <Label className="text-xs">Priority</Label>
            <Select name="priority" defaultValue="normal">
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isPending} size="sm" className="mt-4">
            {isPending
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Sending…</>
              : <><Send className="h-3.5 w-3.5 mr-1.5" />Send</>
            }
          </Button>
        </div>
      </form>
    </div>
  )
}

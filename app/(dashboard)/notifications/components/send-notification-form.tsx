// app/(dashboard)/notifications/components/send-notification-form.tsx
// Form for sending an in-app or SMS notification to all, active, or a specific member.
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

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default audience when the form first renders. */
const DEFAULT_TARGET = "all"

/** Default delivery channel. */
const DEFAULT_CHANNEL = "in_app"

/** Default priority level. */
const DEFAULT_PRIORITY = "normal"

/** Number of visible rows in the message body textarea. */
const MESSAGE_TEXTAREA_ROWS = 3

/** Target audience options. */
const TARGET_OPTIONS = [
  { value: "all",    label: "All Members"      },
  { value: "active", label: "Active Only"       },
  { value: "member", label: "Specific Member"   },
] as const

/** Delivery channel options. */
const CHANNEL_OPTIONS = [
  { value: "in_app", label: "In-App" },
  { value: "sms",    label: "SMS"    },
] as const

/** Priority options. */
const PRIORITY_OPTIONS = [
  { value: "low",    label: "Low"    },
  { value: "normal", label: "Normal" },
  { value: "high",   label: "High"   },
] as const

const INITIAL_ACTION_STATE: { success?: boolean; error?: string; sent?: number } = {}

// ─── Component ────────────────────────────────────────────────────────────────

export function SendNotificationForm({ members }: { members: any[] }) {
  const [state, formAction, isPending] = useActionState(
    sendNotificationAction,
    INITIAL_ACTION_STATE
  )

  useEffect(() => {
    if (state.success) toast.success(`Notification sent to ${state.sent} member(s).`)
    if (state.error)   toast.error(state.error)
  }, [state])

  return (
    <div className="max-w-md">
      <form action={formAction} className="space-y-3">
        {/* Target audience + channel */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Send To</Label>
            <Select name="target" defaultValue={DEFAULT_TARGET}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Channel</Label>
            <Select name="channel" defaultValue={DEFAULT_CHANNEL}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Specific member selector (shown when target = "member") */}
        <div className="space-y-1.5">
          <Label className="text-xs">Member</Label>
          <SearchableSelect
            name="member_id"
            placeholder="Choose a member"
            searchPlaceholder="Search by name or code..."
            options={members.map((m: any) => ({
              value: m.id,
              label: m.full_name,
              sub:   m.member_code,
            }))}
          />
        </div>

        {/* Notification title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs">Title *</Label>
          <Input
            id="title" name="title"
            placeholder="Notification title"
            required className="h-8 text-xs"
          />
        </div>

        {/* Message body */}
        <div className="space-y-1.5">
          <Label htmlFor="body" className="text-xs">Message *</Label>
          <textarea
            id="body" name="body"
            rows={MESSAGE_TEXTAREA_ROWS}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Write your message..."
            required
          />
        </div>

        {/* Priority + submit */}
        <div className="flex items-center justify-between pt-1">
          <div className="w-32 space-y-1.5">
            <Label className="text-xs">Priority</Label>
            <Select name="priority" defaultValue={DEFAULT_PRIORITY}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isPending} size="sm" className="mt-4">
            {isPending ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Sending…</>
            ) : (
              <><Send className="mr-1.5 h-3.5 w-3.5" />Send</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED COMPONENTS:
//   SendNotificationForm({ members })
//     – form for sending in-app or SMS notifications
//     – target: all | active | specific member
//     – channel: in_app | sms
//
// KEY CONSTANTS:
//   DEFAULT_TARGET    = "all"
//   DEFAULT_CHANNEL   = "in_app"
//   DEFAULT_PRIORITY  = "normal"
//   TARGET_OPTIONS    – [all, active, member]
//   CHANNEL_OPTIONS   – [in_app, sms]
//   PRIORITY_OPTIONS  – [low, normal, high]
//
// RELATED FILES:
//   ../actions.ts                       – sendNotificationAction server action
//   components/ui/searchable-select.tsx – SearchableSelect component

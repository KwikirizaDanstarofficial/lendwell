"use client"

import { useActionState, useState, useEffect } from "react"
import { toast } from "sonner"
import { updatePaymentSettingsAction } from "../actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, MessageSquare, Smartphone } from "lucide-react"

export function PaymentsTab({ sacco }: { sacco: any }) {
  const settings = (() => {
    try { return JSON.parse(sacco?.settings ?? "{}") } catch { return {} }
  })()

  const [state, formAction, isPending] = useActionState(
    updatePaymentSettingsAction,
    {}
  )

  const [mtnEnabled, setMtnEnabled] = useState(settings?.payments?.mtn_enabled ?? false)
  const [airtelEnabled, setAirtelEnabled] = useState(settings?.payments?.airtel_enabled ?? false)
  const [flutterwaveEnabled, setFlutterwaveEnabled] = useState(settings?.payments?.flutterwave_enabled ?? false)

  useEffect(() => {
    if (state.success) toast.success("Payment settings saved!")
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <div className="space-y-6 max-w-2xl">
      <form action={formAction} className="space-y-6">

        {/* Mobile Money */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile Money Uganda
            </CardTitle>
            <CardDescription>
              Enable MTN MoMo and Airtel Money for loan repayments and savings deposits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* MTN */}
            <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-400 flex items-center justify-center font-bold text-yellow-900 text-sm shrink-0">
                  MTN
                </div>
                <div>
                  <p className="font-semibold">MTN Mobile Money</p>
                  <p className="text-sm text-muted-foreground">Accept payments via MTN MoMo Uganda</p>
                  <Badge variant={mtnEnabled ? "default" : "secondary"} className="mt-1">
                    {mtnEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMtnEnabled(!mtnEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${mtnEnabled ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mtnEnabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <input type="hidden" name="mtn_enabled" value={String(mtnEnabled)} />

            {mtnEnabled && (
              <div className="ml-4 pl-4 border-l space-y-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">MTN MoMo Config</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Environment</Label>
                    <Select defaultValue={process.env.MTN_MOMO_ENVIRONMENT ?? "sandbox"}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                        <SelectItem value="production">Production (Live)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Subscription Key</Label>
                    <Input className="h-9 text-xs" placeholder="Set in .env.local" disabled value="••••••••••••" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  MTN MoMo credentials are configured in your <code className="bg-muted px-1 rounded">.env.local</code> file for security.
                </p>
              </div>
            )}

            <Separator />

            {/* Airtel */}
            <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                  AIR
                </div>
                <div>
                  <p className="font-semibold">Airtel Money</p>
                  <p className="text-sm text-muted-foreground">Accept payments via Airtel Money Uganda</p>
                  <Badge variant={airtelEnabled ? "default" : "secondary"} className="mt-1">
                    {airtelEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAirtelEnabled(!airtelEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${airtelEnabled ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${airtelEnabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <input type="hidden" name="airtel_enabled" value={String(airtelEnabled)} />

            {airtelEnabled && (
              <div className="ml-4 pl-4 border-l space-y-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Airtel Money Config</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Environment</Label>
                    <Select defaultValue="sandbox">
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                        <SelectItem value="production">Production (Live)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Client ID</Label>
                    <Input className="h-9 text-xs" placeholder="Set in .env.local" disabled value="••••••••••••" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Airtel Money credentials are configured in your <code className="bg-muted px-1 rounded">.env.local</code> file for security.
                </p>
              </div>
            )}

            <Separator />

            {/* Flutterwave */}
            <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                  FLW
                </div>
                <div>
                  <p className="font-semibold">Flutterwave</p>
                  <p className="text-sm text-muted-foreground">Card payments and bank transfers</p>
                  <Badge variant={flutterwaveEnabled ? "default" : "secondary"} className="mt-1">
                    {flutterwaveEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFlutterwaveEnabled(!flutterwaveEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${flutterwaveEnabled ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flutterwaveEnabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <input type="hidden" name="flutterwave_enabled" value={String(flutterwaveEnabled)} />

            {/* Default Method */}
            <div className="space-y-1.5">
              <Label>Default Payment Method</Label>
              <Select name="default_method" defaultValue={settings?.payments?.default_method ?? "cash"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  {mtnEnabled && <SelectItem value="mtn">MTN Mobile Money</SelectItem>}
                  {airtelEnabled && <SelectItem value="airtel">Airtel Money</SelectItem>}
                  {flutterwaveEnabled && <SelectItem value="flutterwave">Flutterwave</SelectItem>}
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* SMS Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS Settings
            </CardTitle>
            <CardDescription>
              Configure your SMS provider for member notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>SMS Provider</Label>
              <Select name="sms_provider" defaultValue={settings?.sms?.provider ?? "egosms"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="egosms">EgoSMS (Uganda)</SelectItem>
                  <SelectItem value="africas_talking">Africa's Talking</SelectItem>
                  <SelectItem value="twilio">Twilio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sender ID</Label>
              <Input
                name="sender_id"
                defaultValue={settings?.sms?.sender_id ?? "SACCO"}
                placeholder="e.g. SACCO"
                maxLength={11}
              />
              <p className="text-xs text-muted-foreground">
                Max 11 characters. This appears as the sender name on SMS messages.
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
              SMS credentials (API keys, passwords) are configured in your{" "}
              <code className="bg-muted px-1 rounded">.env.local</code> file.
              See <code>.env.example</code> for all required variables.
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Payment Settings
          </Button>
        </div>
      </form>
    </div>
  )
}
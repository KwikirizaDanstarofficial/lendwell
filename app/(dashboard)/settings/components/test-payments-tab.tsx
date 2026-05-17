"use client"

import { useActionState, useState } from "react"
import { toast } from "sonner"
import {
  testFlutterwaveChargeAction,
  testFlutterwaveTransferAction,
} from "../actions"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Smartphone, ArrowUpRight, AlertTriangle } from "lucide-react"

export function TestPaymentsTab() {
  const [chargeState, chargeAction, isChargePending] = useActionState(
    testFlutterwaveChargeAction,
    {}
  )

  const [transferState, transferAction, isTransferPending] = useActionState(
    testFlutterwaveTransferAction,
    {}
  )

  const [chargeAmount, setChargeAmount] = useState("1000")
  const [chargePhone, setChargePhone] = useState("256701234567")

  const [transferAmount, setTransferAmount] = useState("1000")
  const [transferPhone, setTransferPhone] = useState("256701234567")

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 rounded-lg border border-yellow-500 bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-950/20">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Test Flutterwave payments with sandbox credentials. Use test phone
          numbers for safe testing.
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4" />
              Test Charge
            </CardTitle>
            <CardDescription>Collect money from mobile number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={chargeAction} className="space-y-4">
              <div>
                <Label>Phone</Label>
                <Input
                  name="phone"
                  value={chargePhone}
                  onChange={(e) => setChargePhone(e.target.value)}
                />
              </div>
              <div>
                <Label>Amount</Label>
                <Input
                  name="amount"
                  type="number"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isChargePending}>
                {isChargePending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Test Charge
              </Button>
            </form>
            {chargeState.success && (
              <div className="text-sm text-green-600">Success!</div>
            )}
            {chargeState.error && (
              <div className="text-sm text-red-600">{chargeState.error}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpRight className="h-4 w-4" />
              Test Transfer
            </CardTitle>
            <CardDescription>Send money to mobile number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={transferAction} className="space-y-4">
              <div>
                <Label>Phone</Label>
                <Input
                  name="phone"
                  value={transferPhone}
                  onChange={(e) => setTransferPhone(e.target.value)}
                />
              </div>
              <div>
                <Label>Amount</Label>
                <Input
                  name="amount"
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isTransferPending}>
                {isTransferPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Test Transfer
              </Button>
            </form>
            {transferState.success && (
              <div className="text-sm text-green-600">Success!</div>
            )}
            {transferState.error && (
              <div className="text-sm text-red-600">{transferState.error}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

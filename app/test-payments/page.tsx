"use client"

import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { verifyPayment } from "./actions"
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
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react"

interface PaymentState {
  loading?: boolean
  success?: boolean
  error?: string
  txRef?: string
  verified?: boolean
}

declare global {
  interface Window {
    FlutterwaveCheckout: any
  }
}

declare global {
  interface Window {
    Flutterwave: any
  }
}

export default function TestPaymentsPage() {
  const router = useRouter()
  const [state, setState] = useState<PaymentState>({})
  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState("1000")
  const [email, setEmail] = useState("")
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [publicKey, setPublicKey] = useState("")

  useEffect(() => {
    const loadScript = () => {
      if (window.FlutterwaveCheckout) {
        setScriptLoaded(true)
        return
      }

      const script = document.createElement("script")
      script.src = "https://checkout.flutterwave.com/v3.js"
      script.async = true
      script.onload = () => {
        console.log("Flutterwave script loaded")
        setScriptLoaded(true)
      }
      script.onerror = () => {
        console.error("Failed to load Flutterwave script")
        setState({ error: "Failed to load payment script" })
      }
      document.head.appendChild(script)
    }

    loadScript()

    setPublicKey("FLWPUBK-2d8e0af93e384dc25e0260649e091825-X")
  }, [])

  const handlePayment = async () => {
    if (!phone || !amount || !email) {
      toast.error("Please fill in all fields")
      return
    }

    setState({ loading: true })

    try {
      if (!window.FlutterwaveCheckout) {
        throw new Error("Flutterwave not loaded. Please refresh and try again.")
      }

      const txRef = `TEST-${Date.now()}`

      window.FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: txRef,
        amount: parseFloat(amount),
        currency: "UGX",
        payment_options: "card,mobilemoneyuganda",
        customer: {
          email,
          phone_number: phone,
          name: "SACCO Member",
        },
        customizations: {
          title: "SACCO Payment",
          description: "Test payment",
        },
        callback: (res: any) => {
          if (res.status === "successful") {
            setState({ loading: true, txRef: res.tx_ref })
            verifyPayment(res.tx_ref)
              .then((verification) => {
                setState({
                  success: true,
                  verified: verification.verified,
                  loading: false,
                })
                toast.success(verification.message)
              })
              .catch(() => {
                setState({
                  error: "Payment verification failed",
                  loading: false,
                })
              })
          } else if (res.cancelled) {
            setState({ error: "Payment cancelled", loading: false })
          }
        },
        onclose: () => {
          if (state.loading) {
            setState({ loading: false })
          }
        },
      })
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : "Payment failed",
        loading: false,
      })
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Test Payments</h1>
          <p className="text-sm text-muted-foreground">
            Test Flutterwave with live credentials
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pay with Flutterwave
          </CardTitle>
          <CardDescription>
            Enter your details to initiate payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="256701234567"
            />
            <p className="text-xs text-muted-foreground">
              Mobile money registered number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (UGX)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
            />
          </div>

          <Button
            type="button"
            disabled={state.loading}
            onClick={handlePayment}
            className="w-full"
          >
            {state.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {state.loading ? "Verifying..." : "Pay Now"}
          </Button>

          {state.error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500 bg-red-50 p-3 text-sm text-red-700">
              <XCircle className="h-4 w-4" />
              {state.error}
            </div>
          )}

          {state.success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              Payment {state.verified ? "verified successfully" : "completed"}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keys Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Using FLW_PUBLIC_KEY and FLW_SECRET_KEY from environment
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

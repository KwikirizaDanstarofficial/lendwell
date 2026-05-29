// components/receipts/receipt-dialog.tsx
// Modal that displays a printable payment receipt after a successful transaction.
// Opens a new browser window for thermal-printer-style printing.
"use client"

import { useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Printer, X } from "lucide-react"

import type { ReceiptData } from "@/types/receipt"
export type { ReceiptData } from "@/types/receipt"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Print window dimensions. Sized for an 80mm thermal receipt printer. */
const PRINT_WINDOW_WIDTH  = 400
const PRINT_WINDOW_HEIGHT = 600

/** Date locale used for formatting dates on the receipt. */
const RECEIPT_DATE_LOCALE = "en-UG"

/** Payment method display labels. */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:         "Cash",
  mobile_money: "Mobile Money",
  bank:         "Bank Transfer",
  flutterwave:  "Mobile Money",
  mtn:          "MTN Mobile Money",
  airtel:       "Airtel Money",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUGX(amount: number) {
  return `UGX ${amount.toLocaleString("en-UG", { minimumFractionDigits: 0 })}`
}

function formatMethod(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method
}

interface Props {
  open: boolean
  onClose: () => void
  receipt: ReceiptData
}

export function ReceiptDialog({ open, onClose, receipt }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return

    const win = window.open("", "_blank", `width=${PRINT_WINDOW_WIDTH},height=${PRINT_WINDOW_HEIGHT}`)
    if (!win) return

    win.document.write(`
      <html>
        <head>
          <title>Receipt - ${receipt.receiptRef}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; width: 320px; padding: 16px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .label { color: #555; }
            .amount { font-size: 18px; font-weight: bold; text-align: center; margin: 8px 0; }
            .footer { text-align: center; margin-top: 12px; font-size: 10px; color: #555; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `)
    win.document.close()
  }

  const date    = new Date(receipt.performedAt)
  const dateStr = date.toLocaleDateString(RECEIPT_DATE_LOCALE, { day: "2-digit", month: "short", year: "numeric" })
  const timeStr = date.toLocaleTimeString(RECEIPT_DATE_LOCALE, { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payment Receipt</span>
          </DialogTitle>
        </DialogHeader>

        {/* Printable receipt body */}
        <div
          ref={printRef}
          className="rounded-lg border bg-white p-4 text-sm text-black font-mono"
        >
          {/* Header */}
          <div className="center text-center mb-3">
            <p className="bold text-base font-bold">
              {receipt.saccoName ?? "SACCO Manager"}
            </p>
            <p className="text-xs text-gray-500">Official Payment Receipt</p>
          </div>

          <div className="divider border-t border-dashed border-gray-300 my-2" />

          {/* Type + ref */}
          <div className="text-center mb-2">
            <p className="text-xs uppercase tracking-wide text-gray-400">{receipt.type}</p>
            <p className="text-[10px] text-gray-400">Ref: {receipt.receiptRef}</p>
          </div>

          {/* Amount */}
          <div className="amount text-center my-3">
            <p className="text-2xl font-bold">{formatUGX(receipt.amount)}</p>
          </div>

          <div className="divider border-t border-dashed border-gray-300 my-2" />

          {/* Details */}
          <div className="space-y-1.5">
            <div className="row flex justify-between">
              <span className="label text-gray-500">Member</span>
              <span className="font-medium text-right">{receipt.memberName}</span>
            </div>
            {receipt.memberCode && (
              <div className="row flex justify-between">
                <span className="label text-gray-500">Member Code</span>
                <span>{receipt.memberCode}</span>
              </div>
            )}
            <div className="row flex justify-between">
              <span className="label text-gray-500">Method</span>
              <span>{formatMethod(receipt.paymentMethod)}</span>
            </div>
            {receipt.balanceAfter !== undefined && (
              <div className="row flex justify-between">
                <span className="label text-gray-500">Balance After</span>
                <span className="font-medium">{formatUGX(receipt.balanceAfter)}</span>
              </div>
            )}
            {receipt.narration && (
              <div className="row flex justify-between">
                <span className="label text-gray-500">Narration</span>
                <span className="text-right max-w-[55%]">{receipt.narration}</span>
              </div>
            )}
          </div>

          <div className="divider border-t border-dashed border-gray-300 my-2" />

          {/* Cashier + date */}
          <div className="space-y-1.5">
            <div className="row flex justify-between">
              <span className="label text-gray-500">Served by</span>
              <span className="font-medium">{receipt.performedBy}</span>
            </div>
            <div className="row flex justify-between">
              <span className="label text-gray-500">Date</span>
              <span>{dateStr}</span>
            </div>
            <div className="row flex justify-between">
              <span className="label text-gray-500">Time</span>
              <span>{timeStr}</span>
            </div>
          </div>

          <div className="footer text-center mt-4 text-[10px] text-gray-400">
            <p>Thank you for your payment</p>
            <p>Keep this receipt for your records</p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED COMPONENTS:
//   ReceiptDialog({ open, onClose, receipt })
//     – printable payment receipt dialog
//     – opens a new window for thermal-printer-style printing
//
// EXPORTED TYPES:
//   ReceiptData  – re-exported from @/types/receipt
//
// KEY CONSTANTS:
//   PRINT_WINDOW_WIDTH / HEIGHT  – 400 × 600 px (80 mm thermal receipt size)
//   RECEIPT_DATE_LOCALE          – "en-UG"
//   PAYMENT_METHOD_LABELS        – human-readable labels for payment method codes
//
// RELATED FILES:
//   types/receipt.ts                   – ReceiptData type definition
//   app/(dashboard)/loans/actions.ts   – produces receipt in repayLoanAction
//   app/(dashboard)/savings/actions.ts – produces receipt in deposit/withdrawAction

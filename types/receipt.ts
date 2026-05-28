export type ReceiptData = {
  receiptRef: string
  type: string
  memberName: string
  memberCode?: string
  amount: number
  balanceAfter?: number
  paymentMethod: string
  narration?: string
  performedBy: string
  performedAt: string
  saccoName?: string
}

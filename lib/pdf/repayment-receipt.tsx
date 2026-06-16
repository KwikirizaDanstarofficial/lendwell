import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import type { ReceiptData } from "@/types/receipt"

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  ref: {
    fontSize: 8,
    color: "#999",
    marginTop: 2,
  },
  amount: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: {
    color: "#666",
    fontSize: 9,
  },
  value: {
    fontSize: 9,
    fontWeight: "medium",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
})

function formatUGX(amount: number) {
  return `UGX ${amount.toLocaleString("en-UG", { minimumFractionDigits: 0 })}`
}

function formatMethod(method: string): string {
  const labels: Record<string, string> = {
    cash: "Cash",
    mobile_money: "Mobile Money",
    bank: "Bank Transfer",
    flutterwave: "Mobile Money",
    mtn: "MTN Mobile Money",
    airtel: "Airtel Money",
  }
  return labels[method] ?? method
}

export function RepaymentReceiptPdf({ receipt }: { receipt: ReceiptData }) {
  const date = new Date(receipt.performedAt)
  const dateStr = date.toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" })
  const timeStr = date.toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{receipt.saccoName ?? "Lendwell SACCO"}</Text>
          <Text style={styles.subtitle}>Official Payment Receipt</Text>
          <Text style={styles.ref}>Ref: {receipt.receiptRef}</Text>
        </View>

        <View style={{ textAlign: "center", marginBottom: 8 }}>
          <Text style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 2 }}>
            {receipt.type}
          </Text>
        </View>

        <Text style={styles.amount}>{formatUGX(receipt.amount)}</Text>

        <View>
          <View style={styles.row}>
            <Text style={styles.label}>Member</Text>
            <Text style={styles.value}>{receipt.memberName}</Text>
          </View>
          {receipt.memberCode && (
            <View style={styles.row}>
              <Text style={styles.label}>Member Code</Text>
              <Text style={styles.value}>{receipt.memberCode}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{formatMethod(receipt.paymentMethod)}</Text>
          </View>
          {receipt.balanceAfter !== undefined && (
            <View style={styles.row}>
              <Text style={styles.label}>Balance After</Text>
              <Text style={styles.value}>{formatUGX(receipt.balanceAfter)}</Text>
            </View>
          )}
          {receipt.narration && (
            <View style={styles.row}>
              <Text style={styles.label}>Narration</Text>
              <Text style={styles.value}>{receipt.narration}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Served by</Text>
            <Text style={styles.value}>{receipt.performedBy}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{dateStr}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>{timeStr}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Thank you for your payment. Keep this receipt for your records.
        </Text>
      </Page>
    </Document>
  )
}

export async function downloadReceiptPdf(receipt: ReceiptData) {
  const { pdf } = await import("@react-pdf/renderer")

  const blob = await pdf(<RepaymentReceiptPdf receipt={receipt} />).toBlob()
  const url = URL.createObjectURL(blob)

  const now = new Date()
  const dateStr = now.toISOString().split("T")[0]
  const timeStr = now.toTimeString().split(":").slice(0, 2).join("-")
  const safeName = receipt.memberName.replace(/[^a-zA-Z0-9]/g, "_")

  const a = document.createElement("a")
  a.href = url
  a.download = `${safeName}_${dateStr}_${timeStr}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

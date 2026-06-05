import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { SaccoHeader } from "./sacco-header"

const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 48,
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#111827",
  },
  title: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 8,
    fontFamily: "Times-Italic",
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 16,
  },
  memberBox: {
    flexDirection: "row",
    gap: 16,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 4,
    padding: 10,
    marginBottom: 14,
  },
  memberField: {
    flex: 1,
  },
  memberLabel: {
    fontSize: 7,
    fontFamily: "Times-Roman",
    color: "#6b7280",
    marginBottom: 1,
  },
  memberValue: {
    fontSize: 9,
    fontFamily: "Times-Bold",
    color: "#111827",
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
  },
  kpiLabel: {
    fontSize: 7,
    fontFamily: "Times-Roman",
    color: "#6b7280",
    marginBottom: 2,
    textAlign: "center",
  },
  kpiValue: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    color: "#15803d",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Times-Bold",
    color: "#16a34a",
    borderBottomWidth: 1,
    borderBottomColor: "#d1fae5",
    paddingBottom: 3,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#16a34a",
    padding: 5,
    borderRadius: 2,
    marginBottom: 1,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 7,
    fontFamily: "Times-Bold",
  },
  tableRow: {
    flexDirection: "row",
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 4,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableCell: {
    fontSize: 8,
    fontFamily: "Times-Roman",
    color: "#374151",
  },
  amountCredit: {
    fontSize: 8,
    fontFamily: "Times-Bold",
    color: "#16a34a",
  },
  amountDebit: {
    fontSize: 8,
    fontFamily: "Times-Bold",
    color: "#dc2626",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    fontFamily: "Times-Italic",
    color: "#9ca3af",
  },
})

function formatUGX(amount: number) {
  return `UGX ${amount.toLocaleString()}`
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-UG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function isCredit(type: string) {
  return type === "savings_deposit" || type === "fine_payment"
}

interface Transaction {
  id: string
  type: string
  amount: number
  balanceAfter: number
  paymentMethod: string
  narration: string | null
  createdAt: string
}

interface Member {
  memberCode: string
  fullName: string
  phone: string | null
  email: string | null
  status: string
  joinedAt: string | null
}

interface Sacco {
  name?: string
  address?: string
  contactPhone?: string
  contactEmail?: string
  logoUrl?: string
  tagline?: string
  primaryColor?: string
}

interface MemberTransactionsDocumentProps {
  member: Member
  transactions: Transaction[]
  sacco: Sacco
}

export function MemberTransactionsDocument({
  member,
  transactions,
  sacco,
}: MemberTransactionsDocumentProps) {
  const totalIn = transactions
    .filter((t) => isCredit(t.type))
    .reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions
    .filter((t) => !isCredit(t.type))
    .reduce((s, t) => s + t.amount, 0)
  const generatedAt = new Date().toLocaleString("en-UG")

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SaccoHeader
          name={sacco.name}
          address={sacco.address}
          phone={sacco.contactPhone}
          email={sacco.contactEmail}
          logoUrl={sacco.logoUrl}
          tagline={sacco.tagline}
          primaryColor={sacco.primaryColor}
        />

        <Text style={styles.title}>Member Transaction Statement</Text>
        <Text style={styles.subtitle}>Generated on {generatedAt}</Text>

        {/* Member Info */}
        <View style={styles.memberBox}>
          <View style={styles.memberField}>
            <Text style={styles.memberLabel}>Member Name</Text>
            <Text style={styles.memberValue}>{member.fullName}</Text>
          </View>
          <View style={styles.memberField}>
            <Text style={styles.memberLabel}>Member Code</Text>
            <Text style={styles.memberValue}>{member.memberCode}</Text>
          </View>
          <View style={styles.memberField}>
            <Text style={styles.memberLabel}>Phone</Text>
            <Text style={styles.memberValue}>{member.phone || "—"}</Text>
          </View>
          <View style={styles.memberField}>
            <Text style={styles.memberLabel}>Status</Text>
            <Text style={styles.memberValue}>
              {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
            </Text>
          </View>
          <View style={styles.memberField}>
            <Text style={styles.memberLabel}>Joined</Text>
            <Text style={styles.memberValue}>{formatDate(member.joinedAt)}</Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Transactions</Text>
            <Text style={styles.kpiValue}>{transactions.length}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Credit</Text>
            <Text style={styles.kpiValue}>{formatUGX(totalIn)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Debit</Text>
            <Text style={styles.kpiValue}>{formatUGX(totalOut)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Net</Text>
            <Text style={styles.kpiValue}>{formatUGX(totalIn - totalOut)}</Text>
          </View>
        </View>

        {/* Transactions Table */}
        <Text style={styles.sectionTitle}>All Transactions</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1.6 }]}>Date</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Type</Text>
          <Text style={[styles.tableHeaderText, { flex: 3 }]}>Narration</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.4 }]}>Method</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Amount</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Balance</Text>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "center", color: "#9ca3af" }]}>
              No transactions found
            </Text>
          </View>
        ) : (
          transactions.map((tx, i) => {
            const credit = isCredit(tx.type)
            const rowStyle = i % 2 === 0 ? styles.tableRow : styles.tableRowAlt
            return (
              <View key={tx.id} style={rowStyle}>
                <Text style={[styles.tableCell, { flex: 1.6 }]}>
                  {formatDate(tx.createdAt)}
                </Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {formatType(tx.type)}
                </Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>
                  {tx.narration || "—"}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.4 }]}>
                  {(tx.paymentMethod || "").replace(/_/g, " ")}
                </Text>
                <Text
                  style={[
                    credit ? styles.amountCredit : styles.amountDebit,
                    { flex: 1.5, textAlign: "right" },
                  ]}
                >
                  {credit ? "+" : "-"}
                  {tx.amount.toLocaleString()}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right" }]}>
                  {tx.balanceAfter != null ? tx.balanceAfter.toLocaleString() : "—"}
                </Text>
              </View>
            )
          })
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {sacco.name} — Confidential Member Statement
          </Text>
          <Text style={styles.footerText}>{generatedAt}</Text>
        </View>
      </Page>
    </Document>
  )
}

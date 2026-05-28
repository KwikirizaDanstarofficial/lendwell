import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { SaccoHeader } from "./sacco-header"

const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 52,
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#111827",
    backgroundColor: "#ffffff",
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
  // ── Stat row ──
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  kpiBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  kpiLabel: { fontSize: 7, color: "#6b7280", marginBottom: 2, textAlign: "center" },
  kpiValue: { fontSize: 11, fontFamily: "Times-Bold", textAlign: "center" },
  kpiGreen: { color: "#16a34a" },
  kpiBlue: { color: "#2563eb" },
  kpiOrange: { color: "#d97706" },
  kpiPurple: { color: "#7c3aed" },
  // ── Section ──
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#16a34a",
    borderBottomWidth: 1,
    borderBottomColor: "#d1fae5",
    paddingBottom: 3,
    marginBottom: 8,
  },
  // ── Info grid ──
  infoRow: { flexDirection: "row", gap: 12, marginBottom: 5 },
  infoField: { flex: 1 },
  infoLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 1 },
  infoValue: { fontSize: 9, fontFamily: "Times-Bold", color: "#111827" },
  // ── Loan card ──
  loanCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  loanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  loanRef: { fontSize: 10, fontFamily: "Times-Bold", color: "#111827" },
  loanStatus: {
    fontSize: 7,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
  },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5 },
  progressBar: { flex: 1, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: "#16a34a", borderRadius: 2 },
  progressLabel: { fontSize: 7, color: "#374151" },
  // ── Table ──
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#16a34a",
    padding: 5,
    borderRadius: 2,
    marginBottom: 1,
  },
  tableHeaderText: { color: "#ffffff", fontSize: 7, fontFamily: "Times-Bold" },
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
  tableCell: { fontSize: 8, fontFamily: "Times-Roman", color: "#374151" },
  amountCredit: { fontSize: 8, fontFamily: "Times-Bold", color: "#16a34a" },
  amountDebit: { fontSize: 8, fontFamily: "Times-Bold", color: "#dc2626" },
  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  },
  footerText: { fontSize: 7, fontFamily: "Times-Italic", color: "#9ca3af" },
})

function formatUGX(n: number) {
  return `UGX ${n.toLocaleString()}`
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" })
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function isCredit(type: string) {
  return type === "savings_deposit" || type === "fine_payment"
}

function formatType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

const LOAN_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:   { bg: "#dcfce7", text: "#15803d" },
  disbursed:{ bg: "#dbeafe", text: "#1d4ed8" },
  pending:  { bg: "#fef9c3", text: "#a16207" },
  approved: { bg: "#ede9fe", text: "#6d28d9" },
  settled:  { bg: "#f3f4f6", text: "#6b7280" },
  declined: { bg: "#fee2e2", text: "#b91c1c" },
  defaulted:{ bg: "#fecaca", text: "#991b1b" },
}

const FINE_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#fef9c3", text: "#a16207" },
  paid:    { bg: "#dcfce7", text: "#15803d" },
  waived:  { bg: "#f3f4f6", text: "#6b7280" },
}

export interface MemberProfileDocumentProps {
  member: {
    memberCode: string
    fullName: string
    phone: string | null
    email: string | null
    nationalId: string | null
    dateOfBirth: string | null
    address: string | null
    status: string
    joinedAt: string | null
    nextOfKin: string | null
    nextOfKinPhone: string | null
    nextOfKinRelationship: string | null
    nextOfKinAddress: string | null
  }
  stats: {
    totalSavings: number
    totalLoans: number
    totalFines: number
    totalTransactions: number
  }
  loans: Array<{
    id: string
    loanRef: string
    amount: number
    balance: number
    expectedReceived: number
    interestRate: string
    interestType: string
    durationMonths: number
    monthlyPayment: number
    dailyPayment: number
    status: string
    dueDate: Date | null
    disbursedAt: Date | null
  }>
  savings: Array<{
    id: string
    accountNumber: string
    accountType: string
    balance: number
    isLocked: boolean
  }>
  fines: Array<{
    id: string
    fine_ref: string
    reason: string
    amount: number
    status: string
    createdAt: string
    due_date: Date | null
  }>
  transactions: Array<{
    id: string
    type: string
    amount: number
    balanceAfter: number
    paymentMethod: string
    narration: string | null
    createdAt: string
  }>
  sacco: {
    name?: string
    address?: string
    contactPhone?: string
    contactEmail?: string
    logoUrl?: string
    tagline?: string
    primaryColor?: string
  }
}

export function MemberProfileDocument({
  member,
  stats,
  loans,
  savings,
  fines,
  transactions,
  sacco,
}: MemberProfileDocumentProps) {
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

        <Text style={styles.title}>Member Profile Report</Text>
        <Text style={styles.subtitle}>Generated on {generatedAt}</Text>

        {/* ── Stats ── */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Savings</Text>
            <Text style={[styles.kpiValue, styles.kpiGreen]}>{formatUGX(stats.totalSavings)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Active Loans</Text>
            <Text style={[styles.kpiValue, styles.kpiBlue]}>{formatUGX(stats.totalLoans)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Pending Fines</Text>
            <Text style={[styles.kpiValue, styles.kpiOrange]}>{formatUGX(stats.totalFines)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Transactions</Text>
            <Text style={[styles.kpiValue, styles.kpiPurple]}>{stats.totalTransactions}</Text>
          </View>
        </View>

        {/* ── Member Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Details</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{member.fullName}</Text>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Member Code</Text>
              <Text style={styles.infoValue}>{member.memberCode}</Text>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>{cap(member.status)}</Text>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>{formatDate(member.joinedAt)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{member.phone || "—"}</Text>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{member.email || "—"}</Text>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>National ID</Text>
              <Text style={styles.infoValue}>{member.nationalId || "—"}</Text>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{formatDate(member.dateOfBirth)}</Text>
            </View>
          </View>
          {member.address && (
            <View style={styles.infoRow}>
              <View style={[styles.infoField, { flex: 4 }]}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{member.address}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Next of Kin ── */}
        {(member.nextOfKin || member.nextOfKinPhone) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next of Kin</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{member.nextOfKin || "—"}</Text>
              </View>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Relationship</Text>
                <Text style={styles.infoValue}>{member.nextOfKinRelationship || "—"}</Text>
              </View>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{member.nextOfKinPhone || "—"}</Text>
              </View>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{member.nextOfKinAddress || "—"}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Loans ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loans ({loans.length})</Text>
          {loans.length === 0 ? (
            <Text style={{ fontSize: 8, color: "#9ca3af", textAlign: "center", marginTop: 4 }}>No loans on record</Text>
          ) : (
            loans.map((loan) => {
              const repaid = loan.expectedReceived - loan.balance
              const pct = loan.expectedReceived > 0
                ? Math.min(100, Math.round((repaid / loan.expectedReceived) * 100))
                : 0
              const sc = LOAN_STATUS_COLORS[loan.status] ?? { bg: "#f3f4f6", text: "#6b7280" }
              return (
                <View key={loan.id} style={styles.loanCard}>
                  <View style={styles.loanHeader}>
                    <Text style={styles.loanRef}>{loan.loanRef}</Text>
                    <Text style={[styles.loanStatus, { backgroundColor: sc.bg, color: sc.text }]}>
                      {loan.status.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Principal</Text>
                      <Text style={styles.infoValue}>{formatUGX(loan.amount)}</Text>
                    </View>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Total to Repay</Text>
                      <Text style={[styles.infoValue, { color: "#16a34a" }]}>{formatUGX(loan.expectedReceived)}</Text>
                    </View>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Balance</Text>
                      <Text style={[styles.infoValue, { color: "#d97706" }]}>{formatUGX(loan.balance)}</Text>
                    </View>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Interest</Text>
                      <Text style={styles.infoValue}>{loan.interestRate}% · {loan.interestType}</Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Duration</Text>
                      <Text style={styles.infoValue}>{loan.durationMonths} months</Text>
                    </View>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Monthly Payment</Text>
                      <Text style={styles.infoValue}>{formatUGX(loan.monthlyPayment)}</Text>
                    </View>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Due Date</Text>
                      <Text style={styles.infoValue}>{formatDate(loan.dueDate)}</Text>
                    </View>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Disbursed</Text>
                      <Text style={styles.infoValue}>{formatDate(loan.disbursedAt)}</Text>
                    </View>
                  </View>
                  {(loan.status === "active" || loan.status === "disbursed") && (
                    <View style={styles.progressRow}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.progressLabel}>{pct}% repaid</Text>
                    </View>
                  )}
                </View>
              )
            })
          )}
        </View>

        {/* ── Savings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings Accounts ({savings.length})</Text>
          {savings.length === 0 ? (
            <Text style={{ fontSize: 8, color: "#9ca3af", textAlign: "center", marginTop: 4 }}>No savings accounts</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Account No.</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Type</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Balance</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>Status</Text>
              </View>
              {savings.map((acc, i) => (
                <View key={acc.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{acc.accountNumber}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{acc.accountType}</Text>
                  <Text style={[styles.amountCredit, { flex: 1.5, textAlign: "right" }]}>{formatUGX(acc.balance)}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>{acc.isLocked ? "Locked" : "Active"}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* ── Fines ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fines ({fines.length})</Text>
          {fines.length === 0 ? (
            <Text style={{ fontSize: 8, color: "#9ca3af", textAlign: "center", marginTop: 4 }}>No fines on record</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Ref</Text>
                <Text style={[styles.tableHeaderText, { flex: 3 }]}>Reason</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Amount</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Date</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>Status</Text>
              </View>
              {fines.map((fine, i) => {
                const sc = FINE_STATUS_COLORS[fine.status] ?? { bg: "#f3f4f6", text: "#6b7280" }
                return (
                  <View key={fine.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{fine.fine_ref}</Text>
                    <Text style={[styles.tableCell, { flex: 3 }]}>{fine.reason}</Text>
                    <Text style={[styles.amountDebit, { flex: 1.5, textAlign: "right" }]}>{formatUGX(fine.amount)}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{formatDate(fine.createdAt)}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: "center", color: sc.text }]}>{cap(fine.status)}</Text>
                  </View>
                )
              })}
            </>
          )}
        </View>

        {/* ── Transactions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions ({transactions.length})</Text>
          {transactions.length === 0 ? (
            <Text style={{ fontSize: 8, color: "#9ca3af", textAlign: "center", marginTop: 4 }}>No transactions</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1.6 }]}>Date</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Type</Text>
                <Text style={[styles.tableHeaderText, { flex: 2.5 }]}>Narration</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Amount</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Balance</Text>
              </View>
              {transactions.map((tx, i) => {
                const credit = isCredit(tx.type)
                return (
                  <View key={tx.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={[styles.tableCell, { flex: 1.6 }]}>{formatDate(tx.createdAt)}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{formatType(tx.type)}</Text>
                    <Text style={[styles.tableCell, { flex: 2.5 }]}>{tx.narration || "—"}</Text>
                    <Text style={[credit ? styles.amountCredit : styles.amountDebit, { flex: 1.5, textAlign: "right" }]}>
                      {credit ? "+" : "-"}{tx.amount.toLocaleString()}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right" }]}>
                      {tx.balanceAfter != null ? tx.balanceAfter.toLocaleString() : "—"}
                    </Text>
                  </View>
                )
              })}
            </>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{sacco.name} — Confidential Member Profile</Text>
          <Text style={styles.footerText}>{generatedAt}</Text>
        </View>
      </Page>
    </Document>
  )
}

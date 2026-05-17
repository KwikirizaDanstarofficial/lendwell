import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { SaccoHeader } from "./sacco-header"

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 8,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 16,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
  },
  kpiLabel: {
    fontSize: 7,
    color: "#6b7280",
    marginBottom: 2,
    textAlign: "center",
  },
  kpiValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#15803d",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#16a34a",
    borderBottomWidth: 1,
    borderBottomColor: "#d1fae5",
    paddingBottom: 3,
    marginBottom: 8,
    textTransform: "uppercase",
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
    fontWeight: "bold",
    flex: 1,
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
    color: "#374151",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontSize: 7,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 6,
    color: "#9ca3af",
  },
  section: {
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
  },
  summaryLabel: {
    fontSize: 7,
    color: "#6b7280",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
  },
})

function formatUGX(cents: number) {
  return `UGX ${(cents / 100).toLocaleString()}`
}

function formatDate(date: any) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString()
}

interface ReportDocumentProps {
  type: "overview" | "loans" | "savings" | "members" | "fines" | "transactions"
  stats: any
  loans?: any[]
  savings?: any[]
  members?: any[]
  fines?: any[]
  transactions?: any[]
  complaints?: any[]
  notifications?: any[]
  sacco: any
  dateRange?: string
}

export function ReportDocument({
  type,
  stats,
  loans = [],
  savings = [],
  members = [],
  fines = [],
  transactions = [],
  complaints = [],
  notifications = [],
  sacco,
  dateRange,
}: ReportDocumentProps) {
  const titles: Record<string, string> = {
    overview: "SACCO Overview Report",
    loans: "Loans Report",
    savings: "Savings Report",
    members: "Members Report",
    fines: "Fines Report",
    transactions: "Transactions Report",
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SaccoHeader
          name={sacco.name}
          address={sacco.address}
          phone={sacco.contact_phone}
          email={sacco.contact_email}
          logoUrl={sacco.logo_url}
          tagline={sacco.tagline}
          primaryColor={sacco.primary_color}
        />

        <Text style={styles.title}>{titles[type]}</Text>
        <Text style={styles.subtitle}>
          Generated: {new Date().toLocaleDateString()}
          {dateRange ? ` · Period: ${dateRange}` : ""}
        </Text>

        {/* OVERVIEW */}
        {type === "overview" && (
          <>
            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Total Members</Text>
                <Text style={styles.kpiValue}>{stats.totalMembers}</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Total Loans</Text>
                <Text style={styles.kpiValue}>
                  {formatUGX(stats.totalLoansAmount)}
                </Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Total Savings</Text>
                <Text style={styles.kpiValue}>
                  {formatUGX(stats.totalSavings)}
                </Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Pending Fines</Text>
                <Text style={styles.kpiValue}>
                  {formatUGX(stats.pendingFines)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Active Members</Text>
                <Text style={styles.summaryValue}>{stats.activeMembers}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Active Loans</Text>
                <Text style={styles.summaryValue}>
                  {stats.activeLoansCount}
                </Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Settled Loans</Text>
                <Text style={styles.summaryValue}>
                  {stats.settledLoansCount}
                </Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Savings Accounts</Text>
                <Text style={styles.summaryValue}>{stats.savingsCount}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Loans</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Ref</Text>
                <Text style={styles.tableHeaderText}>Member</Text>
                <Text style={styles.tableHeaderText}>Amount</Text>
                <Text style={styles.tableHeaderText}>Status</Text>
                <Text style={styles.tableHeaderText}>Date</Text>
              </View>
              {loans.slice(0, 10).map((l, i) => (
                <View
                  key={l.id}
                  style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                >
                  <Text style={styles.tableCell}>{l.loan_ref}</Text>
                  <Text style={styles.tableCell}>{l.member_name ?? "—"}</Text>
                  <Text style={styles.tableCell}>{formatUGX(l.amount)}</Text>
                  <Text style={styles.tableCell}>{l.status}</Text>
                  <Text style={styles.tableCell}>
                    {formatDate(l.created_at)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Savers</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Member</Text>
                <Text style={styles.tableHeaderText}>Account No</Text>
                <Text style={styles.tableHeaderText}>Balance</Text>
                <Text style={styles.tableHeaderText}>Status</Text>
              </View>
              {savings.slice(0, 10).map((s, i) => (
                <View
                  key={s.id}
                  style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                >
                  <Text style={styles.tableCell}>{s.member_name ?? "—"}</Text>
                  <Text style={styles.tableCell}>{s.account_number}</Text>
                  <Text style={styles.tableCell}>{formatUGX(s.balance)}</Text>
                  <Text style={styles.tableCell}>
                    {s.is_locked ? "Locked" : "Active"}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* LOANS */}
        {type === "loans" && (
          <>
            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Total Disbursed</Text>
                <Text style={styles.kpiValue}>
                  {formatUGX(stats.totalLoansAmount)}
                </Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Outstanding</Text>
                <Text style={styles.kpiValue}>
                  {formatUGX(stats.activeLoansAmount)}
                </Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Active</Text>
                <Text style={styles.kpiValue}>{stats.activeLoansCount}</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Settled</Text>
                <Text style={styles.kpiValue}>{stats.settledLoansCount}</Text>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Loans</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Ref</Text>
                <Text style={styles.tableHeaderText}>Member</Text>
                <Text style={styles.tableHeaderText}>Amount</Text>
                <Text style={styles.tableHeaderText}>Balance</Text>
                <Text style={styles.tableHeaderText}>Monthly</Text>
                <Text style={styles.tableHeaderText}>Status</Text>
                <Text style={styles.tableHeaderText}>Due</Text>
              </View>
              {loans.map((l, i) => (
                <View
                  key={l.id}
                  style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                >
                  <Text style={styles.tableCell}>{l.loan_ref}</Text>
                  <Text style={styles.tableCell}>{l.member_name ?? "—"}</Text>
                  <Text style={styles.tableCell}>{formatUGX(l.amount)}</Text>
                  <Text style={styles.tableCell}>{formatUGX(l.balance)}</Text>
                  <Text style={styles.tableCell}>
                    {formatUGX(l.monthly_payment ?? 0)}
                  </Text>
                  <Text style={styles.tableCell}>{l.status}</Text>
                  <Text style={styles.tableCell}>{formatDate(l.due_date)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* SAVINGS */}
        {type === "savings" && (
          <>
            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Total Savings</Text>
                <Text style={styles.kpiValue}>
                  {formatUGX(stats.totalSavings)}
                </Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Accounts</Text>
                <Text style={styles.kpiValue}>{stats.savingsCount}</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Avg Balance</Text>
                <Text style={styles.kpiValue}>
                  {formatUGX(
                    stats.savingsCount > 0
                      ? Math.floor(stats.totalSavings / stats.savingsCount)
                      : 0
                  )}
                </Text>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Savings Accounts</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Member</Text>
                <Text style={styles.tableHeaderText}>Code</Text>
                <Text style={styles.tableHeaderText}>Account No</Text>
                <Text style={styles.tableHeaderText}>Balance</Text>
                <Text style={styles.tableHeaderText}>Status</Text>
                <Text style={styles.tableHeaderText}>Opened</Text>
              </View>
              {savings.map((s, i) => (
                <View
                  key={s.id}
                  style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                >
                  <Text style={styles.tableCell}>{s.member_name ?? "—"}</Text>
                  <Text style={styles.tableCell}>{s.member_code ?? "—"}</Text>
                  <Text style={styles.tableCell}>{s.account_number}</Text>
                  <Text style={styles.tableCell}>{formatUGX(s.balance)}</Text>
                  <Text style={styles.tableCell}>
                    {s.is_locked ? "Locked" : "Active"}
                  </Text>
                  <Text style={styles.tableCell}>
                    {formatDate(s.created_at)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* MEMBERS */}
        {type === "members" && (
          <>
            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Total Members</Text>
                <Text style={styles.kpiValue}>{stats.totalMembers}</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Active</Text>
                <Text style={styles.kpiValue}>{stats.activeMembers}</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Suspended</Text>
                <Text style={styles.kpiValue}>
                  {stats.totalMembers - stats.activeMembers}
                </Text>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Members List</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Code</Text>
                <Text style={styles.tableHeaderText}>Name</Text>
                <Text style={styles.tableHeaderText}>Phone</Text>
                <Text style={styles.tableHeaderText}>National ID</Text>
                <Text style={styles.tableHeaderText}>Status</Text>
                <Text style={styles.tableHeaderText}>Joined</Text>
              </View>
              {members.map((m, i) => (
                <View
                  key={m.id}
                  style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                >
                  <Text style={styles.tableCell}>{m.member_code}</Text>
                  <Text style={styles.tableCell}>{m.full_name}</Text>
                  <Text style={styles.tableCell}>{m.phone ?? "—"}</Text>
                  <Text style={styles.tableCell}>{m.national_id ?? "—"}</Text>
                  <Text style={styles.tableCell}>{m.status}</Text>
                  <Text style={styles.tableCell}>
                    {formatDate(m.joined_at)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* FINES */}
        {type === "fines" && (
          <>
            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Total Fines</Text>
                <Text style={styles.kpiValue}>
                  {formatUGX(stats.totalFines)}
                </Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Pending</Text>
                <Text style={styles.kpiValue}>
                  {formatUGX(stats.pendingFines)}
                </Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Total Count</Text>
                <Text style={styles.kpiValue}>{stats.finesCount}</Text>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fines List</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Member</Text>
                <Text style={styles.tableHeaderText}>Code</Text>
                <Text style={styles.tableHeaderText}>Amount</Text>
                <Text style={styles.tableHeaderText}>Reason</Text>
                <Text style={styles.tableHeaderText}>Status</Text>
                <Text style={styles.tableHeaderText}>Date</Text>
              </View>
              {fines.map((f, i) => (
                <View
                  key={f.id}
                  style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                >
                  <Text style={styles.tableCell}>{f.member_name ?? "—"}</Text>
                  <Text style={styles.tableCell}>{f.member_code ?? "—"}</Text>
                  <Text style={styles.tableCell}>{formatUGX(f.amount)}</Text>
                  <Text style={styles.tableCell}>{f.reason ?? "—"}</Text>
                  <Text style={styles.tableCell}>{f.status}</Text>
                  <Text style={styles.tableCell}>
                    {formatDate(f.created_at)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* TRANSACTIONS */}
        {type === "transactions" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Ledger</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Member</Text>
              <Text style={styles.tableHeaderText}>Type</Text>
              <Text style={styles.tableHeaderText}>Amount</Text>
              <Text style={styles.tableHeaderText}>Method</Text>
              <Text style={styles.tableHeaderText}>Narration</Text>
              <Text style={styles.tableHeaderText}>Date</Text>
            </View>
            {transactions.map((t, i) => (
              <View
                key={t.id}
                style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={styles.tableCell}>{t.member_name ?? "—"}</Text>
                <Text style={styles.tableCell}>
                  {t.type?.replace(/_/g, " ")}
                </Text>
                <Text style={styles.tableCell}>{formatUGX(t.amount)}</Text>
                <Text style={styles.tableCell}>{t.payment_method ?? "—"}</Text>
                <Text style={styles.tableCell}>{t.narration ?? "—"}</Text>
                <Text style={styles.tableCell}>{formatDate(t.created_at)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {sacco.name} · {titles[type]}
          </Text>
          <Text style={styles.footerText}>Confidential</Text>
          <Text style={styles.footerText}>
            Generated: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

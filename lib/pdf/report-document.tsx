import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { SaccoHeader } from "./sacco-header"
import { BarChart, LineChart } from "./charts"

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
    fontFamily: "Times-Roman",
    color: "#374151",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontSize: 7,
    fontFamily: "Times-Bold",
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
    fontFamily: "Times-Roman",
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
    fontFamily: "Times-Roman",
    color: "#6b7280",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    color: "#111827",
  },
  chartRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  chartBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 6,
    backgroundColor: "#fafafa",
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
  complaints: _complaints = [],
  notifications: _notifications = [],
  sacco,
  dateRange,
}: ReportDocumentProps) {
  const primaryColor = sacco?.primaryColor ?? sacco?.primary_color ?? "#16a34a"

  // ── Chart data derivations ────────────────────────────────────────────────

  // Loan status counts
  const loanStatusCounts = loans.reduce<Record<string, number>>((acc, l) => {
    const s: string = l.status ?? "unknown"
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})
  const loanStatusData = Object.entries(loanStatusCounts).map(([label, value]) => ({ label, value }))

  // Financial overview (amounts in UGX, not cents)
  const financialsData = [
    { label: "Disbursed", value: Math.round((stats.totalLoansAmount ?? 0) / 100) },
    { label: "Outstanding", value: Math.round((stats.activeLoansAmount ?? 0) / 100) },
    { label: "Savings", value: Math.round((stats.totalSavings ?? 0) / 100) },
    { label: "Fines", value: Math.round((stats.pendingFines ?? 0) / 100) },
  ].filter((d) => d.value > 0)

  // Monthly loan disbursements (last 8 months)
  const monthlyLoans = (() => {
    const map: Record<string, number> = {}
    loans.forEach((l) => {
      const d = new Date(l.createdAt ?? l.created_at)
      if (isNaN(d.getTime())) return
      const key = d.toLocaleDateString("en-UG", { month: "short", year: "2-digit" })
      map[key] = (map[key] ?? 0) + 1
    })
    return Object.entries(map).slice(-8).map(([label, value]) => ({ label, value }))
  })()

  // Top savers
  const topSaversData = [...savings]
    .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))
    .slice(0, 8)
    .map((s) => ({
      label: ((s.member_name ?? s.memberName ?? "—") as string).split(" ")[0],
      value: Math.round((s.balance ?? 0) / 100),
    }))

  // Member status breakdown
  const memberStatusData = Object.entries(
    members.reduce<Record<string, number>>((acc, m) => {
      const s: string = m.status ?? "unknown"
      acc[s] = (acc[s] ?? 0) + 1
      return acc
    }, {})
  ).map(([label, value]) => ({ label, value }))

  // Fines by status
  const fineStatusData = [
    { label: "Pending", value: Math.round((stats.pendingFines ?? 0) / 100) },
    {
      label: "Collected",
      value: Math.round(((stats.totalFines ?? 0) - (stats.pendingFines ?? 0)) / 100),
    },
  ].filter((d) => d.value > 0)

  // Transaction amounts by type
  const txTypeData = (() => {
    const map: Record<string, number> = {}
    transactions.forEach((t) => {
      const key: string = (t.type ?? "other").replace(/_/g, " ")
      map[key] = (map[key] ?? 0) + Math.round((t.amount ?? 0) / 100)
    })
    return Object.entries(map).map(([label, value]): { label: string; value: number } => ({ label, value }))
  })()

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
          phone={sacco.contactPhone ?? sacco.contact_phone}
          email={sacco.contactEmail ?? sacco.contact_email}
          logoUrl={sacco.logoUrl ?? sacco.logo_url}
          tagline={sacco.tagline}
          primaryColor={sacco.primaryColor ?? sacco.primary_color}
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

            {/* Charts */}
            <View style={styles.chartRow}>
              <View style={styles.chartBox}>
                <BarChart
                  data={loanStatusData}
                  width={245}
                  height={130}
                  color={primaryColor}
                  title="Loan Status Distribution"
                />
              </View>
              <View style={styles.chartBox}>
                <BarChart
                  data={financialsData}
                  width={245}
                  height={130}
                  color="#3b82f6"
                  title="Financial Overview (UGX)"
                />
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
                    {formatDate(l.createdAt ?? l.created_at)}
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

            {/* Charts */}
            <View style={styles.chartRow}>
              <View style={styles.chartBox}>
                <BarChart
                  data={loanStatusData}
                  width={245}
                  height={130}
                  color={primaryColor}
                  title="Loans by Status"
                />
              </View>
              <View style={styles.chartBox}>
                {monthlyLoans.length >= 2 ? (
                  <LineChart
                    data={monthlyLoans}
                    width={245}
                    height={130}
                    color="#8b5cf6"
                    title="Monthly Disbursements (count)"
                  />
                ) : (
                  <BarChart
                    data={monthlyLoans.length ? monthlyLoans : loanStatusData}
                    width={245}
                    height={130}
                    color="#8b5cf6"
                    title="Monthly Disbursements (count)"
                  />
                )}
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

            {/* Chart */}
            {topSaversData.length > 0 && (
              <View style={[styles.chartBox, { marginBottom: 16 }]}>
                <BarChart
                  data={topSaversData}
                  width={511}
                  height={130}
                  color={primaryColor}
                  title="Top Savers by Balance (UGX)"
                />
              </View>
            )}

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
                    {formatDate(s.createdAt ?? s.created_at)}
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

            {/* Chart */}
            {memberStatusData.length > 0 && (
              <View style={[styles.chartBox, { marginBottom: 16 }]}>
                <BarChart
                  data={memberStatusData}
                  width={511}
                  height={110}
                  color={primaryColor}
                  title="Members by Status"
                />
              </View>
            )}

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
                  <Text style={styles.tableCell}>{m.memberCode ?? m.member_code}</Text>
                  <Text style={styles.tableCell}>{m.fullName ?? m.full_name}</Text>
                  <Text style={styles.tableCell}>{m.phone ?? "—"}</Text>
                  <Text style={styles.tableCell}>{m.nationalId ?? m.national_id ?? "—"}</Text>
                  <Text style={styles.tableCell}>{m.status}</Text>
                  <Text style={styles.tableCell}>
                    {formatDate(m.joinedAt ?? m.joined_at)}
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

            {/* Chart */}
            {fineStatusData.length > 0 && (
              <View style={[styles.chartBox, { marginBottom: 16 }]}>
                <BarChart
                  data={fineStatusData}
                  width={511}
                  height={110}
                  color="#ef4444"
                  title="Fines Overview (UGX)"
                />
              </View>
            )}

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
                    {formatDate(f.createdAt ?? f.created_at)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* TRANSACTIONS */}
        {type === "transactions" && (
          <>
            {txTypeData.length > 0 && (
              <View style={[styles.chartBox, { marginBottom: 16 }]}>
                <BarChart
                  data={txTypeData}
                  width={511}
                  height={130}
                  color="#3b82f6"
                  title="Transaction Amounts by Type (UGX)"
                />
              </View>
            )}
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
                  <Text style={styles.tableCell}>{formatDate(t.createdAt ?? t.created_at)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {sacco?.name} · {titles[type]}
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

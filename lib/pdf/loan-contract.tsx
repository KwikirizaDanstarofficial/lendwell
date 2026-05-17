// lib/pdf/loan-contract.tsx
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { SaccoHeader } from "./sacco-header"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    color: "#111827",
  },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#16a34a",
    borderBottomWidth: 1,
    borderBottomColor: "#d1fae5",
    paddingBottom: 4,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 12,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 10,
    color: "#111827",
    fontWeight: "bold",
  },
  highlightBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  highlightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  highlightLabel: {
    fontSize: 9,
    color: "#374151",
  },
  highlightValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#15803d",
  },
  scheduleHeader: {
    flexDirection: "row",
    backgroundColor: "#16a34a",
    padding: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  scheduleHeaderText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  scheduleRow: {
    flexDirection: "row",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  scheduleRowAlt: {
    flexDirection: "row",
    padding: 5,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  scheduleCell: {
    fontSize: 8,
    color: "#374151",
    flex: 1,
    textAlign: "center",
  },
  declarationBox: {
    backgroundColor: "#fefce8",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  declarationText: {
    fontSize: 8,
    color: "#374151",
    lineHeight: 1.6,
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 16,
  },
  signatureBox: {
    flex: 1,
    alignItems: "center",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    width: "100%",
    height: 36,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
  },
})

interface LoanContractProps {
  loan: {
    loan_ref: string
    amount: number
    expected_received: number
    balance: number
    interest_rate: string | null
    interest_type: string | null
    duration_months: number | null
    daily_payment: number | null
    monthly_payment: number | null
    late_penalty_fee: number | null
    due_date: string | null
    created_at: Date | null
    notes: string | null
  }
  member: {
    full_name: string
    member_code: string
    phone?: string | null
    national_id?: string | null
    address?: string | null
  }
  sacco: {
    name: string
    address?: string
    contact_phone?: string
    contact_email?: string
    logo_url?: string
    tagline?: string
    primary_color?: string
  }
}

function formatUGX(cents: number) {
  return `UGX ${(cents / 100).toLocaleString()}`
}

export function LoanContractDocument({
  loan,
  member,
  sacco,
}: LoanContractProps) {
  const schedule = []
  const months = loan.duration_months ?? 12
  const startDate = loan.created_at ? new Date(loan.created_at) : new Date()

  for (let i = 1; i <= Math.min(months, 12); i++) {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)
    schedule.push({
      num: i,
      date: date.toLocaleDateString(),
      payment: loan.monthly_payment ?? 0,
      balance: Math.max(
        0,
        loan.expected_received - (loan.monthly_payment ?? 0) * i
      ),
    })
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

        <Text style={styles.title}>LOAN AGREEMENT CONTRACT</Text>
        <Text style={styles.subtitle}>
          Ref: {loan.loan_ref} · Generated: {new Date().toLocaleDateString()}
        </Text>

        {/* Borrower Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Borrower Information</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <Text style={styles.fieldValue}>{member.full_name}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Member Code</Text>
              <Text style={styles.fieldValue}>{member.member_code}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <Text style={styles.fieldValue}>{member.phone ?? "—"}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>National ID</Text>
              <Text style={styles.fieldValue}>{member.national_id ?? "—"}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Address</Text>
              <Text style={styles.fieldValue}>{member.address ?? "—"}</Text>
            </View>
          </View>
        </View>

        {/* Loan Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Loan Summary</Text>
          <View style={styles.highlightBox}>
            <View style={styles.highlightRow}>
              <Text style={styles.highlightLabel}>Principal Amount</Text>
              <Text style={styles.highlightValue}>
                {formatUGX(loan.amount)}
              </Text>
            </View>
            <View style={styles.highlightRow}>
              <Text style={styles.highlightLabel}>
                Interest Rate ({loan.interest_type ?? "monthly"})
              </Text>
              <Text style={styles.highlightValue}>
                {loan.interest_rate ?? "0"}%
              </Text>
            </View>
            <View style={styles.highlightRow}>
              <Text style={styles.highlightLabel}>Duration</Text>
              <Text style={styles.highlightValue}>
                {loan.duration_months ?? 12} months
              </Text>
            </View>
            <View style={styles.highlightRow}>
              <Text style={styles.highlightLabel}>Late Penalty Fee</Text>
              <Text style={styles.highlightValue}>
                {formatUGX(loan.late_penalty_fee ?? 0)}
              </Text>
            </View>
            <View
              style={[
                styles.highlightRow,
                { borderTopWidth: 1, borderTopColor: "#bbf7d0", paddingTop: 6 },
              ]}
            >
              <Text style={[styles.highlightLabel, { fontWeight: "bold" }]}>
                Total Repayable
              </Text>
              <Text style={[styles.highlightValue, { fontSize: 12 }]}>
                {formatUGX(loan.expected_received)}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Daily Payment</Text>
              <Text style={styles.fieldValue}>
                {formatUGX(loan.daily_payment ?? 0)}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Monthly Payment</Text>
              <Text style={styles.fieldValue}>
                {formatUGX(loan.monthly_payment ?? 0)}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Due Date</Text>
              <Text style={styles.fieldValue}>{loan.due_date ?? "—"}</Text>
            </View>
          </View>
        </View>

        {/* Repayment Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. Repayment Schedule (First 12 Months)
          </Text>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleHeaderText}>#</Text>
            <Text style={styles.scheduleHeaderText}>Due Date</Text>
            <Text style={styles.scheduleHeaderText}>Payment</Text>
            <Text style={styles.scheduleHeaderText}>Balance</Text>
          </View>
          {schedule.map((row, i) => (
            <View
              key={i}
              style={i % 2 === 0 ? styles.scheduleRow : styles.scheduleRowAlt}
            >
              <Text style={styles.scheduleCell}>{row.num}</Text>
              <Text style={styles.scheduleCell}>{row.date}</Text>
              <Text style={styles.scheduleCell}>{formatUGX(row.payment)}</Text>
              <Text style={styles.scheduleCell}>{formatUGX(row.balance)}</Text>
            </View>
          ))}
        </View>

        {/* Terms & Declaration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Terms & Declaration</Text>
          <View style={styles.declarationBox}>
            <Text style={styles.declarationText}>
              I, the borrower, acknowledge that I have received and understood
              the terms of this loan agreement. I agree to repay the total
              amount of {formatUGX(loan.expected_received)} as per the schedule
              above. I understand that late payments may attract a penalty fee
              of {formatUGX(loan.late_penalty_fee ?? 0)}. I authorize{" "}
              {sacco.name} to deduct repayments from my savings account in case
              of default. This agreement is binding upon signing.
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Borrower Signature</Text>
            <Text style={[styles.signatureLabel, { marginTop: 2 }]}>
              {member.full_name}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Officer</Text>
            <Text style={[styles.signatureLabel, { marginTop: 2 }]}>
              {sacco.name}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Official Stamp</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{sacco.name} · Loan Contract</Text>
          <Text style={styles.footerText}>{loan.loan_ref}</Text>
          <Text style={styles.footerText}>
            Generated: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

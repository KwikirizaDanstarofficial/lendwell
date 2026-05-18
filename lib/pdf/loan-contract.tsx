import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { SaccoHeader } from "./sacco-header"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  accentBar: {
    height: 4,
    marginBottom: 16,
    borderRadius: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 4,
    color: "#111827",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 9,
    fontFamily: "Times-Italic",
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingBottom: 5,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
    fontSize: 7,
    fontFamily: "Times-Roman",
    color: "#9ca3af",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    color: "#111827",
  },
  highlightBox: {
    borderRadius: 6,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  highlightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  highlightDivider: {
    borderTopWidth: 1,
    marginVertical: 6,
  },
  highlightLabel: {
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#374151",
  },
  highlightValue: {
    fontSize: 10,
    fontFamily: "Times-Bold",
  },
  highlightTotalLabel: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    color: "#111827",
  },
  highlightTotalValue: {
    fontSize: 13,
    fontFamily: "Times-Bold",
  },
  scheduleContainer: {
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  scheduleHeader: {
    flexDirection: "row",
    padding: 7,
  },
  scheduleHeaderText: {
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Times-Bold",
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
    fontFamily: "Times-Roman",
    color: "#374151",
    flex: 1,
    textAlign: "center",
  },
  declarationBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
  },
  declarationText: {
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#374151",
    lineHeight: 1.8,
    textAlign: "justify",
  },
  signaturesGrid: {
    flexDirection: "row",
    gap: 16,
    marginTop: 20,
  },
  signatureBox: {
    flex: 1,
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: "Times-Roman",
    color: "#6b7280",
    textAlign: "center",
  },
  signatureName: {
    fontSize: 8,
    fontFamily: "Times-Bold",
    color: "#374151",
    textAlign: "center",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    fontFamily: "Times-Roman",
    color: "#9ca3af",
  },
  stampBox: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    borderStyle: "dashed",
    padding: 8,
    width: 90,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  stampLabel: {
    fontSize: 7,
    fontFamily: "Times-Roman",
    color: "#d1d5db",
    textAlign: "center",
  },
})

interface LoanContractProps {
  loan: {
    loanRef: string
    amount: number
    expectedReceived: number
    balance: number
    interestRate: string | null
    interestType: string | null
    durationMonths: number | null
    dailyPayment: number | null
    monthlyPayment: number | null
    latePenaltyFee: number | null
    dueDate: string | Date | null
    createdAt: Date | string | null
    notes: string | null
  }
  member: {
    fullName: string
    memberCode: string
    phone?: string | null
    nationalId?: string | null
    address?: string | null
  }
  sacco: {
    name: string
    address?: string
    phone?: string
    email?: string
    logoUrl?: string
    tagline?: string
    primaryColor?: string
  }
}

function formatUGX(cents: number) {
  return `UGX ${(cents / 100).toLocaleString("en-UG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

function Field({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "—"}</Text>
    </View>
  )
}

export function LoanContractDocument({
  loan,
  member,
  sacco,
}: LoanContractProps) {
  const primaryColor = sacco.primaryColor || "#16a34a"

  const schedule = []
  const months = loan.durationMonths ?? 12
  const startDate = loan.createdAt ? new Date(loan.createdAt) : new Date()

  for (let i = 1; i <= Math.min(months, 12); i++) {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)
    const paid = (loan.monthlyPayment ?? 0) * i
    const remaining = Math.max(0, (loan.expectedReceived ?? loan.amount) - paid)
    schedule.push({
      num: i,
      date: date.toLocaleDateString("en-UG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      payment: loan.monthlyPayment ?? 0,
      balance: remaining,
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top accent bar */}
        <View
          style={[styles.accentBar, { backgroundColor: primaryColor }]}
        />

        <SaccoHeader
          name={sacco.name}
          address={sacco.address}
          phone={sacco.phone}
          email={sacco.email}
          logoUrl={sacco.logoUrl}
          tagline={sacco.tagline}
          primaryColor={primaryColor}
        />

        <Text style={styles.title}>LOAN AGREEMENT CONTRACT</Text>
        <Text style={styles.subtitle}>
          Ref: {loan.loanRef} · Issued:{" "}
          {loan.createdAt
            ? new Date(loan.createdAt).toLocaleDateString("en-UG", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            : new Date().toLocaleDateString()}
        </Text>

        {/* Borrower Info */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: primaryColor, borderBottomColor: `${primaryColor}30` },
            ]}
          >
            1. Borrower Information
          </Text>
          <View style={styles.row}>
            <Field label="Full Name" value={member.fullName} />
            <Field label="Member Code" value={member.memberCode} />
          </View>
          <View style={styles.row}>
            <Field label="Phone" value={member.phone} />
            <Field label="National ID" value={member.nationalId} />
            <Field label="Address" value={member.address} />
          </View>
        </View>

        {/* Loan Summary */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: primaryColor, borderBottomColor: `${primaryColor}30` },
            ]}
          >
            2. Loan Summary
          </Text>
          <View
            style={[
              styles.highlightBox,
              {
                backgroundColor: `${primaryColor}08`,
                borderColor: `${primaryColor}30`,
              },
            ]}
          >
            <View style={styles.highlightRow}>
              <Text style={styles.highlightLabel}>Principal Amount</Text>
              <Text
                style={[styles.highlightValue, { color: primaryColor }]}
              >
                {formatUGX(loan.amount)}
              </Text>
            </View>
            <View style={styles.highlightRow}>
              <Text style={styles.highlightLabel}>
                Interest Rate ({loan.interestType ?? "monthly"})
              </Text>
              <Text
                style={[styles.highlightValue, { color: primaryColor }]}
              >
                {loan.interestRate ?? "0"}%
              </Text>
            </View>
            <View style={styles.highlightRow}>
              <Text style={styles.highlightLabel}>Duration</Text>
              <Text
                style={[styles.highlightValue, { color: primaryColor }]}
              >
                {loan.durationMonths ?? 12} months
              </Text>
            </View>
            <View style={styles.highlightRow}>
              <Text style={styles.highlightLabel}>Late Penalty Fee</Text>
              <Text
                style={[styles.highlightValue, { color: primaryColor }]}
              >
                {formatUGX(loan.latePenaltyFee ?? 0)}
              </Text>
            </View>
            <View
              style={[
                styles.highlightDivider,
                { borderTopColor: `${primaryColor}30` },
              ]}
            />
            <View style={styles.highlightRow}>
              <Text style={styles.highlightTotalLabel}>
                Total Repayable (incl. interest)
              </Text>
              <Text
                style={[
                  styles.highlightTotalValue,
                  { color: primaryColor },
                ]}
              >
                {formatUGX(loan.expectedReceived)}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <Field
              label="Daily Payment"
              value={formatUGX(loan.dailyPayment ?? 0)}
            />
            <Field
              label="Monthly Payment"
              value={formatUGX(loan.monthlyPayment ?? 0)}
            />
            <Field
              label="Due Date"
              value={
                loan.dueDate
                  ? new Date(loan.dueDate).toLocaleDateString("en-UG", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"
              }
            />
          </View>
        </View>

        {/* Repayment Schedule */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: primaryColor, borderBottomColor: `${primaryColor}30` },
            ]}
          >
            3. Repayment Schedule (First {Math.min(months, 12)} Months)
          </Text>
          <View style={styles.scheduleContainer}>
            <View
              style={[
                styles.scheduleHeader,
                { backgroundColor: primaryColor },
              ]}
            >
              <Text style={styles.scheduleHeaderText}>#</Text>
              <Text style={styles.scheduleHeaderText}>Due Date</Text>
              <Text style={styles.scheduleHeaderText}>Payment</Text>
              <Text style={styles.scheduleHeaderText}>Running Balance</Text>
            </View>
            {schedule.map((row, i) => (
              <View
                key={i}
                style={i % 2 === 0 ? styles.scheduleRow : styles.scheduleRowAlt}
              >
                <Text style={styles.scheduleCell}>{row.num}</Text>
                <Text style={styles.scheduleCell}>{row.date}</Text>
                <Text style={styles.scheduleCell}>
                  {formatUGX(row.payment)}
                </Text>
                <Text style={styles.scheduleCell}>
                  {formatUGX(row.balance)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: primaryColor, borderBottomColor: `${primaryColor}30` },
            ]}
          >
            4. Terms & Declaration
          </Text>
          <View style={styles.declarationBox}>
            <Text style={styles.declarationText}>
              I, the borrower, acknowledge that I have received and understood
              the terms of this loan agreement. I agree to repay the total
              amount of {formatUGX(loan.expectedReceived)} as per the schedule
              above. I understand that late payments may attract a penalty fee
              of {formatUGX(loan.latePenaltyFee ?? 0)}. I authorize{" "}
              {sacco.name} to deduct repayments from my savings account in case
              of default. This agreement is legally binding upon signing by both
              parties.
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signaturesGrid}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Borrower Signature</Text>
            <Text style={styles.signatureName}>{member.fullName}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Officer</Text>
            <Text style={styles.signatureName}>{sacco.name}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.stampBox} />
            <Text style={[styles.signatureLabel, { marginTop: 4 }]}>
              Official Stamp
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{sacco.name} · Loan Agreement</Text>
          <Text style={styles.footerText}>{loan.loanRef}</Text>
          <Text style={styles.footerText}>
            Generated: {new Date().toLocaleDateString("en-UG")}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

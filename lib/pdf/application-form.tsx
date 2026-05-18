import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { SaccoHeader } from "./sacco-header"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 56,
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#111827",
  },
  title: {
    fontSize: 15,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 4,
    color: "#111827",
    letterSpacing: 0.3,
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
    fontSize: 10,
    fontFamily: "Times-Bold",
    color: "#16a34a",
    borderBottomWidth: 1,
    borderBottomColor: "#d1fae5",
    paddingBottom: 4,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 12,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 8,
    fontFamily: "Times-Roman",
    color: "#6b7280",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 3,
    minHeight: 16,
  },
  fieldEmpty: {
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#d1d5db",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 3,
    minHeight: 16,
  },
  photoBox: {
    width: 80,
    height: 100,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  photoLabel: {
    fontSize: 7,
    fontFamily: "Times-Roman",
    color: "#9ca3af",
    textAlign: "center",
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 20,
  },
  signatureBox: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    marginBottom: 4,
    height: 32,
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: "Times-Roman",
    color: "#6b7280",
    textAlign: "center",
  },
  declarationBox: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  declarationText: {
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#374151",
    lineHeight: 1.8,
    textAlign: "justify",
  },
  confirmBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#374151",
    marginTop: 1,
  },
  confirmText: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#374151",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    fontFamily: "Times-Roman",
    color: "#9ca3af",
  },
  officialBox: {
    marginTop: 16,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 4,
    padding: 10,
  },
  officialTitle: {
    fontSize: 9,
    fontFamily: "Times-Bold",
    color: "#15803d",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
})

interface ApplicationFormProps {
  member: {
    fullName: string
    memberCode: string
    phone?: string | null
    email?: string | null
    nationalId?: string | null
    address?: string | null
    dateOfBirth?: string | null
    nextOfKin?: string | null
    nextOfKinPhone?: string | null
    status: string
    joinedAt?: string | null
  }
  sacco: {
    name: string
    address?: string
    contactPhone?: string
    contact_phone?: string
    contactEmail?: string
    contact_email?: string
    logoUrl?: string
    logo_url?: string
    tagline?: string
    primaryColor?: string
    primary_color?: string
  }
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {value ? (
        <Text style={styles.fieldValue}>{value}</Text>
      ) : (
        <Text style={styles.fieldEmpty}> </Text>
      )}
    </View>
  )
}

export function ApplicationFormDocument({
  member,
  sacco,
}: ApplicationFormProps) {
  const primaryColor = sacco.primaryColor ?? sacco.primary_color ?? "#16a34a"

  const dynamicStyles = StyleSheet.create({
    sectionTitle: {
      ...styles.sectionTitle,
      color: primaryColor,
      borderBottomColor: `${primaryColor}20`,
    },
    officialBox: {
      ...styles.officialBox,
      backgroundColor: `${primaryColor}10`,
      borderColor: `${primaryColor}40`,
    },
    officialTitle: {
      ...styles.officialTitle,
      color: primaryColor,
    },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* SACCO Header */}
        <SaccoHeader
          name={sacco.name}
          address={sacco.address}
          phone={sacco.contactPhone ?? sacco.contact_phone}
          email={sacco.contactEmail ?? sacco.contact_email}
          logoUrl={sacco.logoUrl ?? sacco.logo_url}
          tagline={sacco.tagline}
          primaryColor={sacco.primaryColor ?? sacco.primary_color}
        />

        {/* Title */}
        <Text style={styles.title}>MEMBERSHIP APPLICATION FORM</Text>
        <Text style={styles.subtitle}>
          Please fill in all required fields clearly and accurately
        </Text>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>
            1. Personal Information
          </Text>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Field label="Full Name" value={member.fullName} />
              </View>
              <View style={styles.row}>
                <Field label="Date of Birth" value={member.dateOfBirth} />
                <Field label="National ID" value={member.nationalId} />
              </View>
              <View style={styles.row}>
                <Field label="Phone Number" value={member.phone} />
                <Field label="Email Address" value={member.email} />
              </View>
              <View style={styles.row}>
                <Field label="Physical Address" value={member.address} />
              </View>
            </View>
            {/* Photo Box */}
            <View style={styles.photoBox}>
              <Text style={styles.photoLabel}>
                Passport{"\n"}Photo{"\n"}Here
              </Text>
            </View>
          </View>
        </View>

        {/* Next of Kin */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>2. Next of Kin</Text>
          <View style={styles.row}>
            <Field label="Full Name" value={member.nextOfKin} />
            <Field label="Phone Number" value={member.nextOfKinPhone} />
          </View>
          <View style={styles.row}>
            <Field label="Relationship" value={null} />
            <Field label="Address" value={null} />
          </View>
        </View>

        {/* Membership Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Membership Details</Text>
          <View style={styles.row}>
            <Field label="Member Code" value={member.memberCode} />
            <Field label="Status" value={member.status.toUpperCase()} />
            <Field
              label="Date Joined"
              value={
                member.joinedAt
                  ? new Date(member.joinedAt).toLocaleDateString()
                  : undefined
              }
            />
          </View>
        </View>

        {/* Declaration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Declaration</Text>
          <View style={styles.declarationBox}>
            <Text style={styles.declarationText}>
              I, the undersigned, hereby declare that the information provided
              in this form is true, complete, and accurate to the best of my
              knowledge. I agree to abide by the rules, regulations, and by-laws
              of {sacco.name}. I understand that providing false information may
              result in termination of my membership.
            </Text>
          </View>
          <View style={styles.confirmBox}>
            <View style={styles.checkbox} />
            <Text style={styles.confirmText}>
              I confirm that I have read and understood the SACCO terms and
              conditions.
            </Text>
          </View>
          <View style={styles.confirmBox}>
            <View style={styles.checkbox} />
            <Text style={styles.confirmText}>
              I consent to my personal data being used for SACCO operations.
            </Text>
          </View>
          <View style={styles.confirmBox}>
            <View style={styles.checkbox} />
            <Text style={styles.confirmText}>
              I agree to make regular contributions as required by {sacco.name}.
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Member Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Witness Signature</Text>
          </View>
        </View>

        {/* Official Use */}
        <View style={styles.officialBox}>
          <Text style={styles.officialTitle}>FOR OFFICIAL USE ONLY</Text>
          <View style={styles.row}>
            <Field label="Approved By" value={null} />
            <Field label="Date Approved" value={null} />
            <Field label="Ref No" value={member.memberCode} />
          </View>
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Authorized Signature</Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Official Stamp</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {sacco.name} · Membership Application
          </Text>
          <Text style={styles.footerText}>{member.memberCode}</Text>
          <Text style={styles.footerText}>
            Generated: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

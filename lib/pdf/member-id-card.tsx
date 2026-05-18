import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"

// CR80 card: 85.6mm x 53.98mm → 243pt x 153pt at 72dpi
const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: "#ffffff",
    width: 243,
    height: 153,
  },
  card: {
    width: 243,
    height: 153,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  // Decorative background circles
  bgCircle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -30,
    top: -40,
    opacity: 0.08,
  },
  bgCircle2: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    right: 20,
    bottom: 15,
    opacity: 0.06,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    width: 26,
    height: 26,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 26,
    height: 26,
  },
  logoInitial: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
  },
  headerSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 6,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  statusText: {
    color: "#ffffff",
    fontSize: 6,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  body: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    flex: 1,
  },
  photoContainer: {
    width: 52,
    height: 62,
    borderRadius: 5,
    overflow: "hidden",
    marginRight: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  photo: {
    width: 52,
    height: 62,
  },
  photoPlaceholder: {
    width: 52,
    height: 62,
    justifyContent: "center",
    alignItems: "center",
  },
  photoInitials: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 2.5,
    alignItems: "center",
  },
  label: {
    fontSize: 6,
    color: "#9ca3af",
    width: 42,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  value: {
    fontSize: 7,
    color: "#111827",
    fontWeight: "bold",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginTop: 4,
    marginBottom: 4,
  },
  signatureArea: {
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: "#d1d5db",
    paddingTop: 2,
    width: 65,
  },
  signatureLabel: {
    fontSize: 5.5,
    color: "#9ca3af",
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  footerText: {
    fontSize: 5.5,
    color: "#9ca3af",
  },
  memberCodeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  memberCode: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
})

interface MemberIdCardProps {
  member: {
    fullName: string
    memberCode: string
    phone?: string | null
    nationalId?: string | null
    address?: string | null
    joinedAt?: string | null
    photoUrl?: string | null
    status: string
  }
  sacco: {
    name: string
    logoUrl?: string
    primaryColor?: string
  }
}

export function MemberIdCardDocument({ member, sacco }: MemberIdCardProps) {
  const primary = sacco.primaryColor ?? "#16a34a"

  return (
    <Document>
      <Page size={{ width: 243, height: 153 }} style={styles.page}>
        <View style={styles.card}>
          {/* Background decorative circles */}
          <View
            style={[styles.bgCircle1, { backgroundColor: primary }]}
          />
          <View
            style={[styles.bgCircle2, { backgroundColor: primary }]}
          />

          {/* Header */}
          <View style={[styles.header, { backgroundColor: primary }]}>
            <View style={styles.headerLeft}>
              <View style={styles.logoContainer}>
                {sacco.logoUrl ? (
                  <Image src={sacco.logoUrl} style={styles.logo} />
                ) : (
                  <Text style={styles.logoInitial}>
                    {sacco.name.slice(0, 1).toUpperCase()}
                  </Text>
                )}
              </View>
              <View>
                <Text style={styles.headerText}>{sacco.name}</Text>
                <Text style={styles.headerSub}>Member Identity Card</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{member.status}</Text>
            </View>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Photo */}
            <View
              style={[
                styles.photoContainer,
                { borderColor: `${primary}40` },
              ]}
            >
              {member.photoUrl ? (
                <Image src={member.photoUrl} style={styles.photo} />
              ) : (
                <View
                  style={[
                    styles.photoPlaceholder,
                    { backgroundColor: `${primary}20` },
                  ]}
                >
                  <Text style={[styles.photoInitials, { color: primary }]}>
                    {member.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.info}>
              <Text style={styles.name}>{member.fullName}</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Code</Text>
                <Text style={[styles.value, { color: primary }]}>
                  {member.memberCode}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{member.phone ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>ID No</Text>
                <Text style={styles.value}>{member.nationalId ?? "—"}</Text>
              </View>
              <View style={styles.signatureArea}>
                <Text style={styles.signatureLabel}>Member Signature</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Joined:{" "}
              {member.joinedAt
                ? new Date(member.joinedAt).toLocaleDateString("en-UG", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </Text>
            <View
              style={[
                styles.memberCodeBadge,
                { backgroundColor: primary },
              ]}
            >
              <Text style={styles.memberCode}>{member.memberCode}</Text>
            </View>
            <Text style={styles.footerText}>{sacco.name}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

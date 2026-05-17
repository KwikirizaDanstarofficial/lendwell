import { View, Text, Image, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    paddingBottom: 12,
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 16,
    borderRadius: 8,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    marginRight: 16,
    backgroundColor: "#16a34a",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  saccoInfo: {
    flex: 1,
  },
  saccoName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  saccoDetails: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  tagline: {
    fontSize: 8,
    color: "#16a34a",
    marginTop: 2,
    fontStyle: "italic",
  },
})

interface SaccoHeaderProps {
  name?: string
  address?: string
  phone?: string
  email?: string
  logoUrl?: string
  tagline?: string
  primaryColor?: string
}

export function SaccoHeader({
  name,
  address,
  phone,
  email,
  logoUrl,
  tagline,
  primaryColor = "#16a34a",
}: SaccoHeaderProps) {
  const dynamicStyles = StyleSheet.create({
    header: {
      ...styles.header,
      borderBottomColor: primaryColor,
    },
    tagline: {
      ...styles.tagline,
      color: primaryColor,
    },
  })

  return (
    <View style={dynamicStyles.header}>
      {logoUrl ? (
        <Image src={logoUrl} style={styles.logo} />
      ) : (
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>
            {(name || "S").slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.saccoInfo}>
        <Text style={styles.saccoName}>{name}</Text>
        <Text style={styles.saccoDetails}>{address}</Text>
        <Text style={styles.saccoDetails}>
          {phone && `Tel: ${phone}`} {phone && email && " | "}{" "}
          {email && `Email: ${email}`}
        </Text>
        {tagline && <Text style={dynamicStyles.tagline}>{tagline}</Text>}
      </View>
    </View>
  )
}

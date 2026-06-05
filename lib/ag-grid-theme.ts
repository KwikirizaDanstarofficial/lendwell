import { AllCommunityModule, ModuleRegistry, themeQuartz, colorSchemeDark } from "ag-grid-community"

ModuleRegistry.registerModules([AllCommunityModule])

const baseParams = {
  accentColor: "var(--primary)",
  fontFamily: "inherit",
  fontSize: 13,
  rowHeight: 48,
  headerHeight: 42,
}

export const agLightTheme = themeQuartz.withParams({
  ...baseParams,
  backgroundColor: "var(--background)",
  foregroundColor: "var(--foreground)",
  borderColor: "var(--border)",
  rowHoverColor: "var(--muted)",
  headerBackgroundColor: "var(--card)",
  headerTextColor: "var(--card-foreground)",
})

export const agDarkTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  ...baseParams,
  backgroundColor: "var(--background)",
  foregroundColor: "var(--foreground)",
  borderColor: "var(--border)",
  rowHoverColor: "var(--muted)",
  headerBackgroundColor: "var(--card)",
  headerTextColor: "var(--card-foreground)",
  oddRowBackgroundColor: "var(--card)",
})

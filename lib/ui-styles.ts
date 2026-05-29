/**
 * ui-styles.ts
 *
 * Non-style constants for the SACCO UI.
 * Styling uses Tailwind CSS utility classes directly in JSX (shadcn approach).
 * Theme tokens (colors, radius, fonts) are defined in app/globals.css.
 *
 * This file only holds file-upload limits and accepted MIME types that are
 * referenced by both the UI dropzones and the server-side upload logic.
 */

// ─── File upload limits ───────────────────────────────────────────────────────

/** Maximum allowed size for member profile photo uploads (5 MB). */
export const PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024

/** Maximum allowed size for SACCO logo uploads (2 MB). */
export const LOGO_MAX_SIZE_BYTES  = 2 * 1024 * 1024

/** MIME types and extensions accepted for member photo uploads. */
export const PHOTO_ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png":  [".png"],
  "image/webp": [".webp"],
} as const

/** MIME types and extensions accepted for SACCO logo uploads (includes SVG). */
export const LOGO_ACCEPTED_TYPES = {
  ...PHOTO_ACCEPTED_TYPES,
  "image/svg+xml": [".svg"],
} as const

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED:
//   PHOTO_MAX_SIZE_BYTES = 5 242 880  (5 MB)
//   LOGO_MAX_SIZE_BYTES  = 2 097 152  (2 MB)
//   PHOTO_ACCEPTED_TYPES – jpeg, png, webp
//   LOGO_ACCEPTED_TYPES  – jpeg, png, webp, svg
//
// USED BY:
//   app/(dashboard)/members/add/add-member-form.tsx
//   app/(dashboard)/members/[id]/edit/edit-member-form.tsx
//   app/(dashboard)/settings/components/general-tab.tsx
